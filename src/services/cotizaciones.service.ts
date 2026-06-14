import { supabase } from './supabase';
import type { Cotizacion, CotizacionItem } from '../types/supabase.types';
import type { CotizacionFormData } from '../schemas/cotizacion.schema';
import { createOrden } from './ordenes.service';
import type { OrdenFormData } from '../schemas/orden.schema';

export interface CotizacionConItems extends Cotizacion {
  items: CotizacionItem[];
}

async function getNextNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('cotizaciones')
    .select('numero')
    .like('numero', `COT-${year}-%`)
    .order('numero', { ascending: false })
    .limit(1)
    .single();

  if (!data) return `COT-${year}-001`;
  const row = data as { numero: string };
  const lastNum = parseInt(row.numero.split('-')[2] ?? '0') || 0;
  return `COT-${year}-${String(lastNum + 1).padStart(3, '0')}`;
}

export async function getCotizaciones() {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: (data ?? []) as Cotizacion[], error };
}

export async function getCotizacionById(id: string) {
  try {
    const [cotRes, itemsRes] = await Promise.all([
      supabase.from('cotizaciones').select('*').eq('id', id).single(),
      supabase.from('cotizacion_items').select('*').eq('cotizacion_id', id).order('posicion'),
    ]);

    if (cotRes.error) return { data: null, error: cotRes.error };

    const data: CotizacionConItems = {
      ...(cotRes.data as Cotizacion),
      items: (itemsRes.data ?? []) as CotizacionItem[],
    };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function createCotizacion(
  formData: CotizacionFormData,
  userId: string | null
): Promise<{ data: CotizacionConItems | null; error: Error | null }> {
  try {
    const numero   = await getNextNumero();
    const nonEmpty = formData.items.filter(i => i.descripcion.trim() !== '');

    const cotPayload = {
      numero,
      fecha:          new Date().toISOString().split('T')[0],
      fecha_validez:  formData.fecha_validez,
      cliente_id:     formData.cliente_id,
      cliente_nombre: formData.cliente_nombre,
      modo_cobro:     formData.modo_cobro,
      subtotal:       formData.subtotal,
      iva:            formData.iva,
      total:          formData.total,
      estado:         'BORRADOR',
      notas:          formData.notas.trim() || null,
      created_by:     userId,
    };

    const { data: cotRaw, error: cotError } = await supabase
      .from('cotizaciones')
      .insert(cotPayload as never)
      .select()
      .single();

    if (cotError || !cotRaw) {
      return { data: null, error: (cotError as Error) ?? new Error('Error al crear la cotización') };
    }

    const cot = cotRaw as Cotizacion;

    if (nonEmpty.length === 0) {
      return { data: { ...cot, items: [] }, error: null };
    }

    const { data: itemsRaw, error: itemsError } = await supabase
      .from('cotizacion_items')
      .insert(
        nonEmpty.map(item => ({
          cotizacion_id: cot.id,
          posicion:      item.posicion,
          cantidad:      item.cantidad,
          descripcion:   item.descripcion.trim(),
          referencia:    item.referencia.trim() || null,
          dureza:        item.dureza.trim() || null,
          tarifa_unit:   item.tarifa_unit,
          subtotal:      item.subtotal,
        })) as never
      )
      .select();

    if (itemsError) {
      await supabase.from('cotizaciones').delete().eq('id', cot.id);
      return { data: null, error: itemsError as Error };
    }

    return {
      data: { ...cot, items: (itemsRaw ?? []) as CotizacionItem[] },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function updateCotizacionEstado(
  id: string,
  estado: Cotizacion['estado'],
  extra: Partial<Pick<Cotizacion, 'orden_id'>> = {}
) {
  const { data, error } = await supabase
    .from('cotizaciones')
    .update({ estado, ...extra } as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Cotizacion | null, error };
}

export async function convertirCotizacionAOrden(
  cotizacionId: string,
  userId: string | null
): Promise<{ data: { ordenId: string; noDoc: number } | null; error: Error | null }> {
  try {
    const { data: cot } = await getCotizacionById(cotizacionId);
    if (!cot) return { data: null, error: new Error('Cotización no encontrada') };

    const ordenFormData: OrdenFormData = {
      cliente_id:     cot.cliente_id ?? '',
      cliente_nombre: cot.cliente_nombre,
      tipo_doc:       'O.S.',
      modo_cobro:     cot.modo_cobro,
      kg_total:       0,
      tarifa_kg:      0,
      valor:          cot.subtotal,
      iva:            cot.iva,
      cant_total:     cot.items.reduce((s, i) => s + (i.cantidad ?? 0), 0),
      observacion:    cot.notas ?? '',
      items:          cot.items.map(item => ({
        posicion:    item.posicion,
        cantidad:    item.cantidad,
        descripcion: item.descripcion ?? '',
        referencia:  item.referencia ?? '',
        dureza:      item.dureza ?? '',
        tarifa_unit: item.tarifa_unit,
        subtotal:    item.subtotal,
      })),
    };

    const { data: orden, error: ordenError } = await createOrden(ordenFormData, userId);
    if (ordenError || !orden) return { data: null, error: ordenError };

    await updateCotizacionEstado(cotizacionId, 'APROBADA', { orden_id: orden.id });

    return { data: { ordenId: orden.id, noDoc: orden.no_doc }, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}
