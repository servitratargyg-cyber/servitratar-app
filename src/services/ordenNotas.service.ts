import { supabase } from './supabase';
import type { OrdenNota } from '../types/supabase.types';

export async function getOrdenNotas(ordenId: string) {
  return supabase
    .from('orden_notas')
    .select('*')
    .eq('orden_id', ordenId)
    .order('created_at', { ascending: true });
}

export async function addOrdenNota(
  ordenId: string,
  texto: string,
  autorNombre: string,
): Promise<OrdenNota> {
  const { data, error } = await supabase
    .from('orden_notas')
    .insert({ orden_id: ordenId, texto, autor_nombre: autorNombre })
    .select()
    .single();
  if (error) throw error;
  return data as OrdenNota;
}
