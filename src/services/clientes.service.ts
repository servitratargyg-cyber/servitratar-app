import { supabase } from './supabase';
import type { Cliente } from '../types/supabase.types';

export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  return { data: (data ?? []) as Cliente[], error };
}

export async function getClientesActivos() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('estado', 'ACTIVO')
    .order('nombre');
  return { data: (data ?? []) as Cliente[], error };
}

export async function getClienteById(id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  return { data: (data ?? null) as Cliente | null, error };
}

export async function createCliente(
  values: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('clientes')
    .insert(values as never)
    .select()
    .single();
  return { data: (data ?? null) as Cliente | null, error };
}

export async function updateCliente(
  id: string,
  values: Partial<Omit<Cliente, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ ...values, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Cliente | null, error };
}

export async function toggleClienteEstado(id: string, estado: 'ACTIVO' | 'INACTIVO') {
  return updateCliente(id, { estado });
}
