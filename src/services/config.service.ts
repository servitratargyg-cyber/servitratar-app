import { supabase } from './supabase';
import type { Profile } from '../types/supabase.types';
import { EMPRESA, VALOR_MINIMO_ORDEN } from '../lib/constants';

// ── Empresa (localStorage) ────────────────────────────────
export interface EmpresaConfig {
  nombre:              string;
  nit:                 string;
  direccion:           string;
  tel1:                string;
  tel2:                string;
  prefijo:             string;
  valor_minimo_orden:  number;
}

const EMPRESA_KEY = 'servitratar_config_empresa';

const EMPRESA_DEFAULTS: EmpresaConfig = {
  ...EMPRESA,
  valor_minimo_orden: VALOR_MINIMO_ORDEN,
};

export function getEmpresaConfig(): EmpresaConfig {
  try {
    const stored = localStorage.getItem(EMPRESA_KEY);
    if (stored) return { ...EMPRESA_DEFAULTS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...EMPRESA_DEFAULTS };
}

export function saveEmpresaConfig(config: EmpresaConfig): void {
  localStorage.setItem(EMPRESA_KEY, JSON.stringify(config));
}

// ── Usuarios (Supabase profiles) ──────────────────────────
export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');
  return { data: (data ?? []) as Profile[], error };
}

export async function updateProfile(
  id: string,
  values: Partial<Pick<Profile, 'role' | 'is_active' | 'full_name'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values as never)
    .eq('id', id)
    .select()
    .single();
  return { data: (data ?? null) as Profile | null, error };
}

// ── Contraseña ────────────────────────────────────────────
export async function cambiarContrasena(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}
