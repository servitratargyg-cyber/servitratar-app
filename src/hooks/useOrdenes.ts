import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getOrdenes,
  getOrdenById,
  updateOrdenEstado,
  type OrdenesFilters,
} from '../services/ordenes.service';
import type { Orden } from '../types/supabase.types';

export function useOrdenes(filters: OrdenesFilters = {}) {
  return useQuery({
    queryKey: ['ordenes', filters],
    queryFn:  async () => {
      const { data, error } = await getOrdenes(filters);
      if (error) throw error;
      return data;
    },
  });
}

export function useOrden(id: string | undefined) {
  return useQuery({
    queryKey: ['ordenes', id],
    queryFn:  async () => {
      if (!id) return null;
      const { data, error } = await getOrdenById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrdenEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      estado,
      extra,
    }: {
      id:     string;
      estado: Orden['estado'];
      extra?: Partial<Pick<Orden, 'fecha_entrega' | 'fecha_pago' | 'forma_pago' | 'no_factura' | 'motivo_anulacion'>>;
    }) => updateOrdenEstado(id, estado, extra),

    onSuccess: (result, vars) => {
      if (result.error) {
        toast.error('Error al actualizar el estado');
        return;
      }
      toast.success(`Estado actualizado a ${vars.estado}`);
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    },

    onError: () => toast.error('Error al actualizar el estado'),
  });
}
