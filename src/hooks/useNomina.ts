import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getNominas,
  createNomina,
  marcarNominaPagada,
  deleteNomina,
} from '../services/nomina.service';
import type { Empleado } from '../types/supabase.types';
import type { NominaFormData } from '../schemas/nomina.schema';

export function useNominas(mes?: number, anio?: number) {
  return useQuery({
    queryKey: ['nomina', { mes, anio }],
    queryFn:  async () => {
      const { data, error } = await getNominas(mes, anio);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNomina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empleado, form }: { empleado: Empleado; form: NominaFormData }) =>
      createNomina(empleado, form),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${(result.error as Error).message}`); return; }
      toast.success('Nómina liquidada correctamente');
      queryClient.invalidateQueries({ queryKey: ['nomina'] });
    },
    onError: () => toast.error('Error al liquidar la nómina'),
  });
}

export function useMarcarNominaPagada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fecha_pago }: { id: string; fecha_pago: string }) =>
      marcarNominaPagada(id, fecha_pago),
    onSuccess: result => {
      if (result.error) { toast.error('Error al registrar el pago'); return; }
      toast.success('Nómina marcada como pagada');
      queryClient.invalidateQueries({ queryKey: ['nomina'] });
    },
    onError: () => toast.error('Error al registrar el pago'),
  });
}

export function useDeleteNomina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNomina(id),
    onSuccess: () => {
      toast.success('Registro eliminado');
      queryClient.invalidateQueries({ queryKey: ['nomina'] });
    },
    onError: () => toast.error('Error al eliminar el registro'),
  });
}
