import { Badge, type BadgeProps } from '../ui/badge';

type EstadoOrden      = 'RECIBIDA' | 'EN PROCESO' | 'ENTREGADA' | 'FE REGISTRADA' | 'PAGADA' | 'ANULADA';
type EstadoFactura    = 'PDTE PAGO' | 'CANCELADA' | 'ANULADA';
type EstadoCotizacion = 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
type EstadoEmpleado   = 'ACTIVO' | 'INACTIVO' | 'RETIRADO';

type Estado = EstadoOrden | EstadoFactura | EstadoCotizacion | EstadoEmpleado;

const VARIANT_MAP: Record<Estado, BadgeProps['variant']> = {
  RECIBIDA:       'info',
  'EN PROCESO':   'warning',
  ENTREGADA:      'accent',
  'FE REGISTRADA':'purple',
  PAGADA:         'success',
  ANULADA:        'danger',
  'PDTE PAGO':    'warning',
  CANCELADA:      'success',
  BORRADOR:       'default',
  ENVIADA:        'info',
  APROBADA:       'success',
  RECHAZADA:      'danger',
  VENCIDA:        'danger',
  ACTIVO:         'success',
  INACTIVO:       'default',
  RETIRADO:       'danger',
};

interface StatusBadgeProps {
  estado: Estado;
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[estado] ?? 'default'}>
      {estado}
    </Badge>
  );
}
