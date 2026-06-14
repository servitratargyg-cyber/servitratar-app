import { supabase } from './supabase';
import type { Orden, OrdenItem } from '../types/supabase.types';
import type { OrdenFormData } from '../schemas/orden.schema';

export interface OrdenConItems extends Orden {
  items: OrdenItem[];
}

export interface OrdenesFilters {
  estado?:      string;
  tipo_doc?:    string;
  cliente_id?:  string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

async function getNextNoDoc(): Promise<number> {
  const { data } = await supabase
    .from('ordenes')
    .select('no_doc')
    .order('no_doc', { ascending: false })
    .limit(1)
    .single();
  const row = data as { no_doc: number } | null;
  return (row?.no_doc ?? 6000) + 1;
}

export async function getOrdenes(filters: OrdenesFilters = {}) {
  try {
    let query = supabase
      .from('ordenes')
      .select('*')
      .order('no_doc', { ascending: false });

    if (filters.estado)      query = query.eq('estado',     filters.estado);
    if (filters.tipo_doc)    query = query.eq('tipo_doc',   filters.tipo_doc);
    if (filters.cliente_id)  query = query.eq('cliente_id', filters.cliente_id);
    if (filters.fecha_desde) query = query.gte('fecha',     filters.fecha_desde);
    if (filters.fecha_hasta) query = query.lte('fecha',     filters.fecha_hasta);

    const { data, error } = await query;
    return { data: (data ?? []) as Orden[], error };
  } catch (e) {
    return { data: [] as Orden[], error: e as Error };
  }
}

export async function getOrdenById(id: string) {
  try {
    const [ordenRes, itemsRes] = await Promise.all([
      supabase.from('ordenes').select('*').eq('id', id).single(),
      supabase.from('orden_items').select('*').eq('orden_id', id).order('posicion'),
    ]);

    if (ordenRes.error) return { data: null, error: ordenRes.error };

    const data: OrdenConItems = {
      ...(ordenRes.data as Orden),
      items: (itemsRes.data ?? []) as OrdenItem[],
    };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function createOrden(
  formData: OrdenFormData,
  userId: string | null
): Promise<{ data: OrdenConItems | null; error: Error | null }> {
  try {
    const noDoc    = await getNextNoDoc();
    const today    = new Date().toISOString().split('T')[0];
    const nonEmpty = formData.items.filter(i => i.descripcion.trim() !== '');
    const cantTotal = nonEmpty.reduce((s, i) => s + (i.cantidad ?? 0), 0);

    const ordenPayload = {
      no_doc:         noDoc,
      fecha:          today,
      cliente_id:     formData.cliente_id,
      cliente_nombre: formData.cliente_nombre,
      tipo_doc:       formData.tipo_doc,
      modo_cobro:     formData.modo_cobro,
      kg_total:       formData.kg_total,
      tarifa_kg:      formData.tarifa_kg,
      cant_total:     cantTotal,
      valor:          formData.valor,
      iva:            formData.iva,
      estado:         'RECIBIDA',
      observacion:    formData.observacion.trim() || null,
      created_by:     userId,
    };

    const { data: ordenRaw, error: ordenError } = await supabase
      .from('ordenes')
      .insert(ordenPayload as never)
      .select()
      .single();

    if (ordenError || !ordenRaw) {
      return { data: null, error: (ordenError as Error) ?? new Error('Error al crear la orden') };
    }

    const orden = ordenRaw as Orden;

    if (nonEmpty.length === 0) {
      return { data: { ...orden, items: [] }, error: null };
    }

    const itemsPayload = nonEmpty.map(item => ({
      orden_id:    orden.id,
      posicion:    item.posicion,
      cantidad:    item.cantidad,
      descripcion: item.descripcion.trim(),
      referencia:  item.referencia.trim() || null,
      dureza:      item.dureza.trim() || null,
      tarifa_unit: item.tarifa_unit,
      subtotal:    item.subtotal,
    }));

    const { data: itemsRaw, error: itemsError } = await supabase
      .from('orden_items')
      .insert(itemsPayload as never)
      .select();

    if (itemsError) {
      await supabase.from('ordenes').delete().eq('id', orden.id);
      return { data: null, error: itemsError as Error };
    }

    return {
      data: { ...orden, items: (itemsRaw ?? []) as OrdenItem[] },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function updateOrdenEstado(
  id: string,
  estado: Orden['estado'],
  extra: Partial<Pick<Orden, 'fecha_entrega' | 'fecha_pago' | 'forma_pago' | 'no_factura' | 'pdf_url'>> = {}
) {
  const payload = { estado, ...extra, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('ordenes')
    .update(payload as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Orden | null, error };
}

export async function updateOrdenPdfUrl(id: string, pdf_url: string) {
  const { error } = await supabase
    .from('ordenes')
    .update({ pdf_url, updated_at: new Date().toISOString() } as never)
    .eq('id', id);
  return { error };
}

export async function uploadOrdenPDF(blob: Blob, noDoc: number): Promise<string | null> {
  try {
    const { prefijo } = (await import('./config.service')).getEmpresaConfig();
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const path  = `ordenes/${year}/${month}/${prefijo}${noDoc}.pdf`;

    const { error } = await supabase.storage
      .from('documentos')
      .upload(path, blob, { contentType: 'application/pdf', upsert: true });

    if (error) return null;

    const { data } = supabase.storage.from('documentos').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
