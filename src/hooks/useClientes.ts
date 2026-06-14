import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getClientes,
  getClientesActivos,
  getClienteById,
  createCliente,
  updateCliente,
  toggleClienteEstado,
} from '../services/clientes.service';
import type { Cliente } from '../types/supabase.types';

export function useClientes(soloActivos = false) {
  return useQuery({
    queryKey: ['clientes', { soloActivos }],
    queryFn:  async () => {
      const { data, error } = soloActivos
        ? await getClientesActivos()
        : await getClientes();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn:  async () => {
      if (!id) return null;
      const { data, error } = await getClienteById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) =>
      createCliente(values),
    onSuccess: result => {
      if (result.error) { toast.error('Error al crear el cliente'); return; }
      toast.success('Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: () => toast.error('Error al crear el cliente'),
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id:     string;
      values: Partial<Omit<Cliente, 'id' | 'created_at'>>;
    }) => updateCliente(id, values),
    onSuccess: result => {
      if (result.error) { toast.error('Error al actualizar el cliente'); return; }
      toast.success('Cliente actualizado');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: () => toast.error('Error al actualizar el cliente'),
  });
}

export function useToggleClienteEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) =>
      toggleClienteEstado(id, estado),
    onSuccess: result => {
      if (result.error) { toast.error('Error al cambiar el estado'); return; }
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });
}
