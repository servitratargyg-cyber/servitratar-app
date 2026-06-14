import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProfiles,
  updateProfile,
  cambiarContrasena,
  saveEmpresaConfig,
  type EmpresaConfig,
} from '../services/config.service';
import type { Profile } from '../types/supabase.types';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn:  async () => {
      const { data, error } = await getProfiles();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id:     string;
      values: Partial<Pick<Profile, 'role' | 'is_active' | 'full_name'>>;
    }) => updateProfile(id, values),
    onSuccess: r => {
      if (r.error) { toast.error('Error al actualizar el usuario'); return; }
      toast.success('Usuario actualizado');
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: () => toast.error('Error al actualizar el usuario'),
  });
}

export function useSaveEmpresaConfig() {
  return useMutation({
    mutationFn: (config: EmpresaConfig) => {
      saveEmpresaConfig(config);
      return Promise.resolve();
    },
    onSuccess: () => toast.success('Datos guardados — recarga la página para aplicar en los PDFs'),
    onError:   () => toast.error('Error al guardar'),
  });
}

export function useCambiarContrasena() {
  return useMutation({
    mutationFn: (password: string) => cambiarContrasena(password),
    onSuccess: r => {
      if (r.error) { toast.error(`Error: ${r.error.message}`); return; }
      toast.success('Contraseña actualizada correctamente');
    },
    onError: () => toast.error('Error al cambiar la contraseña'),
  });
}
