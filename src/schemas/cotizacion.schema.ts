import { z } from 'zod';

export const cotizacionItemFormSchema = z.object({
  posicion:    z.number().int().min(1),
  cantidad:    z.number().nullable(),
  descripcion: z.string(),
  referencia:  z.string(),
  dureza:      z.string(),
  tarifa_unit: z.number().min(0),
  subtotal:    z.number().min(0),
});

export const cotizacionFormSchema = z.object({
  cliente_id:     z.string().min(1, 'Selecciona un cliente'),
  cliente_nombre: z.string(),
  modo_cobro:     z.enum(['KG', 'UNIDAD']),
  fecha_validez:  z.string().min(1, 'Ingresa la fecha de validez'),
  incluir_iva:    z.boolean(),
  subtotal:       z.number().min(0),
  iva:            z.number().min(0),
  total:          z.number().min(0),
  notas:          z.string(),
  items:          z.array(cotizacionItemFormSchema),
});

export type CotizacionFormData     = z.infer<typeof cotizacionFormSchema>;
export type CotizacionItemFormData = z.infer<typeof cotizacionItemFormSchema>;
