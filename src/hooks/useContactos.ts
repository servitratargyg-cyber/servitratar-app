import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getContactos, createContacto, deleteContacto } from '../services/contactos.service';

export function useContactos(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['contactos', clienteId],
    queryFn:  async () => {
      if (!clienteId) return [];
      const { data, error } = await getContactos(clienteId);
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useCreateContacto(clienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: { nombre: string; email: string; telefono: string }) =>
      createContacto({ cliente_id: clienteId, ...values, email: values.email || null }),
    onSuccess: result => {
      if (result.error) { toast.error('Error al guardar el contacto'); return; }
      toast.success('Contacto agregado');
      qc.invalidateQueries({ queryKey: ['contactos', clienteId] });
    },
    onError: () => toast.error('Error al guardar el contacto'),
  });
}

export function useDeleteContacto(clienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContacto(id),
    onSuccess: result => {
      if (result.error) { toast.error('Error al eliminar el contacto'); return; }
      toast.success('Contacto eliminado');
      qc.invalidateQueries({ queryKey: ['contactos', clienteId] });
    },
    onError: () => toast.error('Error al eliminar el contacto'),
  });
}
