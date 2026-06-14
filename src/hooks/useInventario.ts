import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getInventario,
  createInventarioItem,
  updateInventarioItem,
  getMovimientos,
  registrarMovimiento,
} from '../services/inventario.service';
import type { InventarioItem } from '../types/supabase.types';
import type { MovimientoFormData } from '../schemas/inventario.schema';

export function useInventario() {
  return useQuery({
    queryKey: ['inventario'],
    queryFn:  async () => {
      const { data, error } = await getInventario();
      if (error) throw error;
      return data;
    },
  });
}

export function useMovimientos(itemId?: string) {
  return useQuery({
    queryKey: ['movimientos', itemId],
    queryFn:  async () => {
      const { data, error } = await getMovimientos(itemId);
      if (error) throw error;
      return data;
    },
    enabled: itemId !== undefined ? !!itemId : true,
  });
}

export function useCreateInventarioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>) =>
      createInventarioItem(values),
    onSuccess: r => {
      if (r.error) { toast.error('Error al crear el ítem'); return; }
      toast.success('Ítem creado');
      qc.invalidateQueries({ queryKey: ['inventario'] });
    },
    onError: () => toast.error('Error al crear el ítem'),
  });
}

export function useUpdateInventarioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id:     string;
      values: Partial<Omit<InventarioItem, 'id' | 'created_at'>>;
    }) => updateInventarioItem(id, values),
    onSuccess: r => {
      if (r.error) { toast.error('Error al actualizar'); return; }
      toast.success('Ítem actualizado');
      qc.invalidateQueries({ queryKey: ['inventario'] });
    },
    onError: () => toast.error('Error al actualizar'),
  });
}

export function useRegistrarMovimiento(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ item, form }: { item: InventarioItem; form: MovimientoFormData }) =>
      registrarMovimiento(item, form, userId),
    onSuccess: r => {
      if (r.error) { toast.error(`Error: ${r.error.message}`); return; }
      toast.success('Movimiento registrado');
      qc.invalidateQueries({ queryKey: ['inventario'] });
      qc.invalidateQueries({ queryKey: ['movimientos'] });
    },
    onError: () => toast.error('Error al registrar el movimiento'),
  });
}
