import { z } from 'zod';

export const nominaFormSchema = z.object({
  empleado_id:       z.string().min(1, 'Selecciona un empleado'),
  periodo_mes:       z.number().int().min(1).max(12),
  periodo_anio:      z.number().int().min(2020),
  dias_trabajados:   z.number().min(0).max(30),
  horas_extras:      z.number().min(0),
  otros_ingresos:    z.number().min(0),
  retencion_fte:     z.number().min(0),
  otras_deducciones: z.number().min(0),
  arl_tasa:          z.number().min(0),
  observacion:       z.string(),
});

export type NominaFormData = z.infer<typeof nominaFormSchema>;
