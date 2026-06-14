import { supabase } from './supabase';
import type { InventarioItem, InventarioMovimiento } from '../types/supabase.types';
import type { MovimientoFormData } from '../schemas/inventario.schema';

export interface MovimientoConItem extends InventarioMovimiento {
  item: Pick<InventarioItem, 'codigo' | 'nombre' | 'unidad'>;
}

// ── Items ─────────────────────────────────────────────────

export async function getInventario() {
  const { data, error } = await supabase
    .from('inventario')
    .select('*')
    .order('categoria')
    .order('nombre');
  return { data: (data ?? []) as InventarioItem[], error };
}

export async function createInventarioItem(
  values: Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('inventario')
    .insert(values as never)
    .select()
    .single();
  return { data: (data ?? null) as InventarioItem | null, error };
}

export async function updateInventarioItem(
  id: string,
  values: Partial<Omit<InventarioItem, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('inventario')
    .update({ ...values, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as InventarioItem | null, error };
}

// ── Movimientos ───────────────────────────────────────────

export async function getMovimientos(itemId?: string) {
  let query = supabase
    .from('inventario_movimientos')
    .select('*, item:inventario(codigo, nombre, unidad)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (itemId) query = query.eq('item_id', itemId);

  const { data, error } = await query;
  return { data: (data ?? []) as MovimientoConItem[], error };
}

export async function registrarMovimiento(
  item: InventarioItem,
  form: MovimientoFormData,
  userId: string | null
): Promise<{ data: InventarioMovimiento | null; error: Error | null }> {
  const stock_antes = item.stock_actual;
  let   stock_despues: number;
  let   cantidadGuardada: number;

  if (form.tipo === 'ENTRADA') {
    stock_despues    = stock_antes + form.cantidad;
    cantidadGuardada = form.cantidad;
  } else if (form.tipo === 'SALIDA') {
    stock_despues    = Math.max(0, stock_antes - form.cantidad);
    cantidadGuardada = stock_antes - stock_despues;
  } else {
    // AJUSTE: cantidad = nuevo stock absoluto
    stock_despues    = form.cantidad;
    cantidadGuardada = Math.abs(form.cantidad - stock_antes);
  }

  const { data: mov, error: movError } = await supabase
    .from('inventario_movimientos')
    .insert({
      item_id:       item.id,
      tipo:          form.tipo,
      cantidad:      cantidadGuardada,
      stock_antes,
      stock_despues,
      referencia:    form.referencia.trim() || null,
      nota:          form.nota.trim()       || null,
      created_by:    userId,
    } as never)
    .select()
    .single();

  if (movError) return { data: null, error: movError as Error };

  await updateInventarioItem(item.id, { stock_actual: stock_despues });

  return { data: (mov ?? null) as InventarioMovimiento | null, error: null };
}
