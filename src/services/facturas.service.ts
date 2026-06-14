import { supabase } from './supabase';
import type { Factura, Orden } from '../types/supabase.types';
import type { RegistrarFEData, RegistrarCobroData } from '../schemas/factura.schema';
import { TASAS } from '../lib/constants';
import { getEmpresaConfig } from './config.service';
import { updateOrdenEstado } from './ordenes.service';

export async function getFacturas() {
  const { data, error } = await supabase
    .from('facturas')
    .select('*')
    .order('fecha', { ascending: false });
  return { data: (data ?? []) as Factura[], error };
}

export async function getFacturasCartera() {
  const { data, error } = await supabase
    .from('facturas')
    .select('*')
    .eq('estado', 'PDTE PAGO')
    .order('fecha', { ascending: true });
  return { data: (data ?? []) as Factura[], error };
}

export async function getOrdenesParaFacturar() {
  const { data, error } = await supabase
    .from('ordenes')
    .select('*')
    .eq('estado', 'ENTREGADA')
    .eq('tipo_doc', 'F.E.')
    .order('no_doc', { ascending: false });
  return { data: (data ?? []) as Orden[], error };
}

export function calcularFactura(ordenes: Orden[], aplica_ret: boolean) {
  const base          = ordenes.reduce((s, o) => s + o.valor, 0);
  const iva           = ordenes.reduce((s, o) => s + o.iva,   0);
  const rete_fuente   = aplica_ret ? Math.round(base * TASAS.RETE_FUENTE) : 0;
  const rete_ica      = aplica_ret ? Math.round(base * TASAS.RETE_ICA)    : 0;
  const total_sin_ret = base + iva;
  const total         = total_sin_ret - rete_fuente - rete_ica;
  return { base, iva, rete_fuente, rete_ica, total_sin_ret, total };
}

export async function registrarFE(
  formData: RegistrarFEData,
  ordenes: Orden[]
): Promise<{ data: Factura | null; error: Error | null }> {
  try {
    const calc     = calcularFactura(ordenes, formData.aplica_ret);
    const { prefijo } = getEmpresaConfig();
    const remision    = ordenes
      .map(o => `${prefijo}${o.no_doc}`)
      .join(' · ');

    // Use first orden's client info for the factura header
    const primera = ordenes[0];

    const payload = {
      numero:         formData.numero.trim(),
      fecha:          formData.fecha,
      cliente_id:     primera.cliente_id,
      cliente_nombre: primera.cliente_nombre,
      ...calc,
      remision,
      estado:         'PDTE PAGO',
      cuenta:         formData.cuenta.trim()      || null,
      observacion:    formData.observacion.trim() || null,
    };

    const { data: raw, error: facturaError } = await supabase
      .from('facturas')
      .insert(payload as never)
      .select()
      .single();

    if (facturaError || !raw) {
      return { data: null, error: (facturaError as Error) ?? new Error('Error al crear la factura') };
    }

    const factura = raw as Factura;

    // Update ALL selected ordenes to FE REGISTRADA
    const updateErrors: Error[] = [];
    for (const orden of ordenes) {
      const { error } = await updateOrdenEstado(orden.id, 'FE REGISTRADA', {
        no_factura: formData.numero.trim(),
      });
      if (error) updateErrors.push(error as Error);
    }

    if (updateErrors.length > 0) {
      // Rollback factura if any orden update failed
      await supabase.from('facturas').delete().eq('id', factura.id);
      return { data: null, error: updateErrors[0] };
    }

    return { data: factura, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

export async function registrarCobro(
  factura: Factura,
  cobroData: RegistrarCobroData
): Promise<{ error: Error | null }> {
  try {
    const { error: facturaError } = await supabase
      .from('facturas')
      .update({
        estado:     'CANCELADA',
        fecha_pago: cobroData.fecha_pago,
        cuenta:     cobroData.cuenta.trim() || null,
      } as never)
      .eq('id', factura.id);

    if (facturaError) return { error: facturaError as Error };

    // Find ALL ordenes linked to this factura
    const { data: ordenesData } = await supabase
      .from('ordenes')
      .select('id')
      .eq('no_factura', factura.numero);

    const ordenesLinked = (ordenesData ?? []) as { id: string }[];

    for (const o of ordenesLinked) {
      await updateOrdenEstado(o.id, 'PAGADA', {
        fecha_pago: cobroData.fecha_pago,
        forma_pago: cobroData.forma_pago,
      });
    }

    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
}

export async function anularFactura(factura: Factura): Promise<{ error: Error | null }> {
  try {
    const { error: facturaError } = await supabase
      .from('facturas')
      .update({ estado: 'ANULADA' } as never)
      .eq('id', factura.id);

    if (facturaError) return { error: facturaError as Error };

    // Find ALL ordenes linked to this factura by no_factura
    const { data: ordenesData } = await supabase
      .from('ordenes')
      .select('id')
      .eq('no_factura', factura.numero);

    const ordenesLinked = (ordenesData ?? []) as { id: string }[];

    for (const o of ordenesLinked) {
      await updateOrdenEstado(o.id, 'ENTREGADA');
      await supabase
        .from('ordenes')
        .update({ no_factura: null } as never)
        .eq('id', o.id);
    }

    return { error: null };
  } catch (e) {
    return { error: e as Error };
  }
}
