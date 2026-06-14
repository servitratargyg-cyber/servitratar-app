import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getEmpleados,
  getEmpleadosActivos,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
} from '../services/empleados.service';
import type { Empleado } from '../types/supabase.types';

export function useEmpleado(id: string | undefined) {
  return useQuery({
    queryKey: ['empleados', id],
    queryFn:  async () => {
      if (!id) return null;
      const { data, error } = await getEmpleadoById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useEmpleados(soloActivos = false) {
  return useQuery({
    queryKey: ['empleados', { soloActivos }],
    queryFn:  async () => {
      const { data, error } = soloActivos
        ? await getEmpleadosActivos()
        : await getEmpleados();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Omit<Empleado, 'id' | 'created_at' | 'updated_at'>) =>
      createEmpleado(values),
    onSuccess: result => {
      if (result.error) { toast.error('Error al crear el empleado'); return; }
      toast.success('Empleado creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: () => toast.error('Error al crear el empleado'),
  });
}

export function useUpdateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id:     string;
      values: Partial<Omit<Empleado, 'id' | 'created_at'>>;
    }) => updateEmpleado(id, values),
    onSuccess: result => {
      if (result.error) { toast.error('Error al actualizar el empleado'); return; }
      toast.success('Empleado actualizado');
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
    onError: () => toast.error('Error al actualizar el empleado'),
  });
}
