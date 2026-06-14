import { z } from 'zod';

export const registrarFESchema = z.object({
  orden_ids:   z.array(z.string()).min(1, 'Selecciona al menos una orden'),
  numero:      z.string().min(1, 'Ingresa el número de factura'),
  fecha:       z.string().min(1, 'Ingresa la fecha'),
  cuenta:      z.string(),
  observacion: z.string(),
});

export const registrarCobroSchema = z.object({
  fecha_pago:  z.string().min(1, 'Ingresa la fecha de pago'),
  forma_pago:  z.string().min(1, 'Ingresa la forma de pago'),
  cuenta:      z.string(),
});

export type RegistrarFEData    = z.infer<typeof registrarFESchema>;
export type RegistrarCobroData = z.infer<typeof registrarCobroSchema>;
