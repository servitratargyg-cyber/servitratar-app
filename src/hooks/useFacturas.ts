import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getFacturas,
  getFacturasCartera,
  getOrdenesParaFacturar,
  registrarFE,
  uploadFacturaPDF,
  registrarCobro,
  anularFactura,
} from '../services/facturas.service';
import type { Orden, Factura } from '../types/supabase.types';
import type { RegistrarFEData, RegistrarCobroData } from '../schemas/factura.schema';

export function useFacturas() {
  return useQuery({
    queryKey: ['facturas'],
    queryFn:  async () => {
      const { data, error } = await getFacturas();
      if (error) throw error;
      return data;
    },
  });
}

export function useFacturasCartera() {
  return useQuery({
    queryKey: ['facturas', 'cartera'],
    queryFn:  async () => {
      const { data, error } = await getFacturasCartera();
      if (error) throw error;
      return data;
    },
  });
}

export function useOrdenesParaFacturar() {
  return useQuery({
    queryKey: ['ordenes', 'para-facturar'],
    queryFn:  async () => {
      const { data, error } = await getOrdenesParaFacturar();
      if (error) throw error;
      return data;
    },
  });
}

export { uploadFacturaPDF };

export function useRegistrarFE() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, ordenes, pdfUrl }: { formData: RegistrarFEData; ordenes: Orden[]; pdfUrl?: string }) =>
      registrarFE(formData, ordenes, pdfUrl),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${result.error.message}`); return; }
      toast.success(`Factura ${result.data?.numero} registrada`);
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    },
    onError: () => toast.error('Error al registrar la factura'),
  });
}

export function useRegistrarCobro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      factura,
      cobroData,
    }: {
      factura:   Factura;
      cobroData: RegistrarCobroData;
    }) => registrarCobro(factura, cobroData),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${result.error.message}`); return; }
      toast.success('Cobro registrado — orden marcada como PAGADA');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    },
    onError: () => toast.error('Error al registrar el cobro'),
  });
}

export function useAnularFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (factura: Factura) => anularFactura(factura),
    onSuccess: result => {
      if (result.error) { toast.error(`Error: ${result.error.message}`); return; }
      toast.success('Factura anulada');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    },
    onError: () => toast.error('Error al anular la factura'),
  });
}
