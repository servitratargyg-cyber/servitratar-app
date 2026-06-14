import { z } from 'zod';

export const ordenItemFormSchema = z.object({
  posicion:    z.number().int().min(1),
  cantidad:    z.number().nullable(),
  descripcion: z.string(),
  referencia:  z.string(),
  dureza:      z.string(),
  tarifa_unit: z.number().min(0),
  subtotal:    z.number().min(0),
});

export const ordenFormSchema = z.object({
  cliente_id:     z.string().min(1, 'Selecciona un cliente'),
  cliente_nombre: z.string(),
  tipo_doc:       z.enum(['O.S.', 'F.E.']),
  modo_cobro:     z.enum(['KG', 'UNIDAD']),
  kg_total:       z.number().min(0),
  tarifa_kg:      z.number().min(0),
  valor:          z.number().min(0),
  iva:            z.number().min(0),
  cant_total:     z.number().min(0),
  observacion:    z.string(),
  items:          z.array(ordenItemFormSchema),
});

export type OrdenFormData     = z.infer<typeof ordenFormSchema>;
export type OrdenItemFormData = z.infer<typeof ordenItemFormSchema>;
