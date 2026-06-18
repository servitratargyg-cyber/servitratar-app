import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOrdenNotas, addOrdenNota } from '../services/ordenNotas.service';

export function useOrdenNotas(ordenId: string | undefined) {
  return useQuery({
    queryKey: ['orden_notas', ordenId],
    queryFn:  async () => {
      if (!ordenId) return [];
      const { data, error } = await getOrdenNotas(ordenId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ordenId,
  });
}

export function useAddOrdenNota(ordenId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ texto, autorNombre }: { texto: string; autorNombre: string }) =>
      addOrdenNota(ordenId, texto, autorNombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orden_notas', ordenId] });
      toast.success('Nota agregada');
    },
    onError: () => toast.error('Error al guardar la nota'),
  });
}
