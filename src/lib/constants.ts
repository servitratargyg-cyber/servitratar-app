export const EMPRESA = {
  nombre:    'SERVITRATAR G&G S.A.S.',
  nit:       '901.906.990-4',
  direccion: 'Cra 69B No. 31-18 Sur — Carvajal, Bogotá D.C.',
  tel1:      '312 426 5187',
  tel2:      '310 850 1926',
  prefijo:   'TT',
} as const;

export const VALOR_MINIMO_ORDEN    = 5_000;
export const UMBRAL_RETENCIONES   = 199_999;

export const TASAS = {
  IVA:         0.19,
  RETE_FUENTE: 0.04,
  RETE_ICA:    0.00966,
} as const;

export const NOMINA_TASAS = {
  SALUD_EMPLEADO:    0.04,
  PENSION_EMPLEADO:  0.04,
  SALUD_EMPLEADOR:   0.085,
  PENSION_EMPLEADOR: 0.12,
  CAJA:              0.04,
  SENA:              0.02,
  ICBF:              0.03,
  CESANTIAS:         0.0833,
  INTERESES_CES:     0.01,
  PRIMA:             0.0833,
  VACACIONES:        0.0417,
} as const;

export const AUX_TRANSPORTE_2026 = 200_000;

export const ROLES = {
  ADMIN:    'admin',
  OPERARIO: 'operario',
  CONTADOR: 'contador',
} as const;

export const ESTADOS_ORDEN = [
  'RECIBIDA',
  'EN PROCESO',
  'ENTREGADA',
  'FE REGISTRADA',
  'PAGADA',
  'ANULADA',
] as const;

export const ESTADOS_FACTURA = ['PDTE PAGO', 'CANCELADA', 'ANULADA'] as const;

export const ESTADOS_COTIZACION = [
  'BORRADOR',
  'ENVIADA',
  'APROBADA',
  'RECHAZADA',
  'VENCIDA',
] as const;

export const MODOS_COBRO = ['KG', 'UNIDAD'] as const;
export const TIPOS_DOC   = ['O.S.', 'F.E.'] as const;
