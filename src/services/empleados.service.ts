import { supabase } from './supabase';
import type { Empleado } from '../types/supabase.types';

export async function getEmpleados() {
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .order('apellido');
  return { data: (data ?? []) as Empleado[], error };
}

export async function getEmpleadosActivos() {
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('estado', 'ACTIVO')
    .order('apellido');
  return { data: (data ?? []) as Empleado[], error };
}

export async function getEmpleadoById(id: string) {
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('id', id)
    .single();
  return { data: (data ?? null) as Empleado | null, error };
}

export async function createEmpleado(
  values: Omit<Empleado, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('empleados')
    .insert(values as never)
    .select()
    .single();
  return { data: (data ?? null) as Empleado | null, error };
}

export async function updateEmpleado(
  id: string,
  values: Partial<Omit<Empleado, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('empleados')
    .update({ ...values, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Empleado | null, error };
}
