import { useQuery } from '@tanstack/react-query';
import { getClientes } from '../services/clientes.service';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn:  async () => {
      const { data, error } = await getClientes();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
