import { supabase } from './supabase';
import type { ClienteContacto } from '../types/supabase.types';

export async function getContactos(clienteId: string) {
  const { data, error } = await supabase
    .from('cliente_contactos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: true });
  return { data: (data ?? []) as ClienteContacto[], error };
}

export async function createContacto(
  payload: Omit<ClienteContacto, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('cliente_contactos')
    .insert(payload as never)
    .select()
    .single();
  return { data: (data ?? null) as ClienteContacto | null, error };
}

export async function deleteContacto(id: string) {
  const { error } = await supabase
    .from('cliente_contactos')
    .delete()
    .eq('id', id);
  return { error };
}
