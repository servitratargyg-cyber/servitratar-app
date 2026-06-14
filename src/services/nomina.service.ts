import { supabase } from './supabase';
import type { Empleado, Nomina } from '../types/supabase.types';
import type { NominaFormData } from '../schemas/nomina.schema';
import { NOMINA_TASAS, AUX_TRANSPORTE_2026 } from '../lib/constants';

export interface NominaConEmpleado extends Nomina {
  empleado: Pick<Empleado, 'nombre' | 'apellido' | 'cargo' | 'cedula'>;
}

function round(n: number) { return Math.round(n); }

export function calcularNomina(
  empleado: Empleado,
  form: NominaFormData
): Omit<Nomina, 'id' | 'created_at' | 'empleado_id' | 'periodo_mes' | 'periodo_anio' | 'estado' | 'fecha_pago' | 'observacion'> {
  const { dias_trabajados, horas_extras, otros_ingresos, retencion_fte, otras_deducciones, arl_tasa } = form;

  const salarioProp   = round((empleado.salario_base / 30) * dias_trabajados);
  const auxReal       = empleado.aux_transporte
    ? round(AUX_TRANSPORTE_2026 * dias_trabajados / 30)
    : 0;

  const total_devengado   = salarioProp + auxReal + horas_extras + otros_ingresos;
  const salud_empleado    = round(salarioProp * NOMINA_TASAS.SALUD_EMPLEADO);
  const pension_empleado  = round(salarioProp * NOMINA_TASAS.PENSION_EMPLEADO);
  const total_deducciones = salud_empleado + pension_empleado + retencion_fte + otras_deducciones;
  const neto_pagar        = total_devengado - total_deducciones;

  const salud_empleador    = round(salarioProp * NOMINA_TASAS.SALUD_EMPLEADOR);
  const pension_empleador  = round(salarioProp * NOMINA_TASAS.PENSION_EMPLEADOR);
  const arl                = round(salarioProp * arl_tasa);
  const caja               = round(salarioProp * NOMINA_TASAS.CAJA);
  const sena               = round(salarioProp * NOMINA_TASAS.SENA);
  const icbf               = round(salarioProp * NOMINA_TASAS.ICBF);
  const cesantias          = round(salarioProp * NOMINA_TASAS.CESANTIAS);
  const intereses_ces      = round(salarioProp * NOMINA_TASAS.INTERESES_CES);
  const prima              = round(salarioProp * NOMINA_TASAS.PRIMA);
  const vacaciones         = round(salarioProp * NOMINA_TASAS.VACACIONES);

  return {
    salario_base: empleado.salario_base,
    aux_transporte: auxReal,
    dias_trabajados,
    horas_extras,
    otros_ingresos,
    total_devengado,
    salud_empleado,
    pension_empleado,
    retencion_fte,
    otras_deducciones,
    total_deducciones,
    neto_pagar,
    salud_empleador,
    pension_empleador,
    arl,
    caja,
    sena,
    icbf,
    cesantias,
    intereses_ces,
    prima,
    vacaciones,
  };
}

export async function getNominas(mes?: number, anio?: number) {
  let query = supabase
    .from('nomina')
    .select('*, empleado:empleados(nombre, apellido, cargo, cedula)')
    .order('periodo_anio', { ascending: false })
    .order('periodo_mes',  { ascending: false });

  if (mes  !== undefined) query = query.eq('periodo_mes',  mes);
  if (anio !== undefined) query = query.eq('periodo_anio', anio);

  const { data, error } = await query;
  return { data: (data ?? []) as NominaConEmpleado[], error };
}

export async function createNomina(
  empleado: Empleado,
  form: NominaFormData
): Promise<{ data: Nomina | null; error: Error | null }> {
  const calculo = calcularNomina(empleado, form);

  const payload = {
    empleado_id:   form.empleado_id,
    periodo_mes:   form.periodo_mes,
    periodo_anio:  form.periodo_anio,
    estado:        'BORRADOR',
    observacion:   form.observacion.trim() || null,
    ...calculo,
  };

  const { data, error } = await supabase
    .from('nomina')
    .insert(payload as never)
    .select()
    .single();

  return { data: (data ?? null) as Nomina | null, error: error as Error | null };
}

export async function marcarNominaPagada(id: string, fecha_pago: string) {
  const { data, error } = await supabase
    .from('nomina')
    .update({ estado: 'PAGADA', fecha_pago } as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Nomina | null, error };
}

export async function deleteNomina(id: string) {
  const { error } = await supabase.from('nomina').delete().eq('id', id);
  return { error };
}
