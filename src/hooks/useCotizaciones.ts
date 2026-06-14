import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateCotizacionEstado,
  convertirCotizacionAOrden,
} from '../services/cotizaciones.service';
import type { Cotizacion } from '../types/supabase.types';
import type { CotizacionFormData } from '../schemas/cotizacion.schema';

export function useCotizaciones() {
  return useQuery({
    queryKey: ['cotizaciones'],
    queryFn:  async () => {
      const { data, error } = await getCotizaciones();
      if (error) throw error;
      return data;
    },
  });
}

export function useCotizacion(id: string | undefined) {
  return useQuery({
    queryKey: ['cotizaciones', id],
    queryFn:  async () => {
      if (!id) return null;
      const { data, error } = await getCotizacionById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCotizacion(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CotizacionFormData) => createCotizacion(data, userId),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${result.error.message}`); return; }
      toast.success(`Cotización ${result.data?.numero} creada`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
    onError: () => toast.error('Error al crear la cotización'),
  });
}

export function useUpdateCotizacionEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id:     string;
      estado: Cotizacion['estado'];
    }) => updateCotizacionEstado(id, estado),
    onSuccess: (result, vars) => {
      if (result.error) { toast.error('Error al actualizar el estado'); return; }
      toast.success(`Estado actualizado a ${vars.estado}`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
    },
    onError: () => toast.error('Error al actualizar el estado'),
  });
}

export function useConvertirAOrden(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cotizacionId: string) =>
      convertirCotizacionAOrden(cotizacionId, userId),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${result.error.message}`); return; }
      toast.success(`Orden TT${result.data?.noDoc} creada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    },
    onError: () => toast.error('Error al convertir la cotización'),
  });
}
