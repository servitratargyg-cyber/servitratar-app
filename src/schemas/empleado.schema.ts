import { z } from 'zod';

export const empleadoFormSchema = z.object({
  nombre:            z.string().min(1, 'Requerido'),
  apellido:          z.string().min(1, 'Requerido'),
  cedula:            z.string().min(5, 'Cédula inválida'),
  cargo:             z.string(),
  tipo_contrato:     z.enum(['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'PRESTACION']),
  fecha_ingreso:     z.string().min(1, 'Requerido'),
  fecha_retiro:      z.string(),
  salario_base:      z.number().min(0),
  aux_transporte:    z.boolean(),
  cuenta_bancaria:   z.string(),
  banco:             z.string(),
  tipo_cuenta:       z.enum(['AHORROS', 'CORRIENTE']).nullable(),
  eps:               z.string(),
  afp:               z.string(),
  arl:               z.string(),
  caja_compensacion: z.string(),
  estado:            z.enum(['ACTIVO', 'INACTIVO', 'RETIRADO']),
});

export type EmpleadoFormData = z.infer<typeof empleadoFormSchema>;
