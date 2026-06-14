import { z } from 'zod';

export const inventarioItemSchema = z.object({
  codigo:          z.string().min(1, 'Requerido'),
  nombre:          z.string().min(1, 'Requerido'),
  descripcion:     z.string(),
  categoria:       z.string(),
  unidad:          z.string().min(1, 'Requerido'),
  stock_actual:    z.number().min(0),
  stock_minimo:    z.number().min(0),
  precio_unitario: z.number().min(0),
  proveedor:       z.string(),
  ubicacion:       z.string(),
  activo:          z.boolean(),
});

export type InventarioItemFormData = z.infer<typeof inventarioItemSchema>;

export const movimientoSchema = z.object({
  tipo:       z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  cantidad:   z.number({ message: 'Requerido' }).min(0),
  referencia: z.string(),
  nota:       z.string(),
});

export type MovimientoFormData = z.infer<typeof movimientoSchema>;
