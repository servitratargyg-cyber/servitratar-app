import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getOrdenes,
  getOrdenById,
  updateOrdenEstado,
  getOrdenHistorial,
  cambiarEstadoOrden,
  type OrdenesFilters,
  type EstadoExtra,
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

export function useOrdenHistorial(id: string | undefined) {
  return useQuery({
    queryKey: ['orden_historial', id],
    queryFn:  async () => {
      if (!id) return [];
      const { data, error } = await getOrdenHistorial(id);
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
      logInfo,
    }: {
      id:       string;
      estado:   Orden['estado'];
      extra?:   Partial<Pick<Orden, 'fecha_entrega' | 'fecha_pago' | 'forma_pago' | 'no_factura' | 'motivo_anulacion'>>;
      logInfo?: { estadoAnterior: string; usuarioNombre: string; nota?: string };
    }) => updateOrdenEstado(id, estado, extra, logInfo),

    onSuccess: (result, vars) => {
      if (result.error) {
        toast.error('Error al actualizar el estado');
        return;
      }
      toast.success(`Estado actualizado a ${vars.estado}`);
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['orden_historial', vars.id] });
    },

    onError: () => toast.error('Error al actualizar el estado'),
  });
}

export function useCambiarEstadoOrden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orden,
      nuevoEstado,
      datosExtra,
      usuarioNombre,
      nota,
    }: {
      orden:         Orden;
      nuevoEstado:   Orden['estado'];
      datosExtra:    EstadoExtra;
      usuarioNombre: string;
      nota?:         string;
    }) => cambiarEstadoOrden(orden, nuevoEstado, datosExtra, usuarioNombre, nota),

    onSuccess: (result, vars) => {
      if (result.error) {
        toast.error('Error al cambiar el estado');
        return;
      }
      toast.success(`Estado: ${vars.orden.estado} → ${vars.nuevoEstado}`);
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['orden_historial', vars.orden.id] });
    },

    onError: () => toast.error('Error al cambiar el estado'),
  });
}
