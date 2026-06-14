import { z } from 'zod';

export const clienteFormSchema = z.object({
  nombre:         z.string().min(1, 'El nombre es requerido'),
  razon_social:   z.string(),
  nit:            z.string(),
  direccion:      z.string(),
  ciudad:         z.string(),
  convenio:       z.string(),
  telefono:       z.string(),
  email:          z.string(),
  tarifa_defecto: z.number().min(0),
  modo_cobro:     z.enum(['KG', 'UNIDAD']),
  tipo_doc:       z.enum(['O.S.', 'F.E.']),
  aplica_ret:     z.boolean(),
  estado:         z.enum(['ACTIVO', 'INACTIVO']),
});

export type ClienteFormData = z.infer<typeof clienteFormSchema>;
