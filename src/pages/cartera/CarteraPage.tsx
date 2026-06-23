import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrarCobroSchema, type RegistrarCobroData } from '../../schemas/factura.schema';
import { useFacturasCartera, useRegistrarCobro } from '../../hooks/useFacturas';
import type { Factura } from '../../types/supabase.types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { PageLoader } from '../../components/shared/LoadingSpinner';

// ── Semáforo ──────────────────────────────────────────────
type Semaforo = 'verde' | 'amarillo' | 'rojo';

function getSemaforo(fechaFactura: string): Semaforo {
  const dias = Math.floor(
    (Date.now() - new Date(fechaFactura).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dias < 30)  return 'verde';
  if (dias < 60)  return 'amarillo';
  return 'rojo';
}

function getDias(fechaFactura: string): number {
  return Math.floor(
    (Date.now() - new Date(fechaFactura).getTime()) / (1000 * 60 * 60 * 24)
  );
}

const SEMAFORO_STYLE: Record<Semaforo, string> = {
  verde:    'bg-green-500',
  amarillo: 'bg-amber-400',
  rojo:     'bg-red-500',
};

const SEMAFORO_LABEL: Record<Semaforo, string> = {
  verde:    'Al día',
  amarillo: 'Por vencer',
  rojo:     'Vencida',
};

// ── CobroModal ────────────────────────────────────────────
interface CobroModalProps {
  factura: Factura | null;
  onClose: () => void;
}

function CobroModal({ factura, onClose }: CobroModalProps) {
  const registrar = useRegistrarCobro();
  const today     = new Date().toLocaleDateString('en-CA');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrarCobroData>({
    resolver: zodResolver(registrarCobroSchema),
    defaultValues: { fecha_pago: today, forma_pago: '', cuenta: '' },
  });

  async function onSubmit(data: RegistrarCobroData) {
    if (!factura) return;
    const result = await registrar.mutateAsync({ factura, cobroData: data });
    if (!result.error) { reset(); onClose(); }
  }

  return (
    <Dialog
      open={!!factura}
      onClose={onClose}
      title="Registrar cobro"
      className="max-w-md"
    >
      {factura && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
          <p className="font-semibold text-gray-800">{factura.numero}</p>
          <p className="text-gray-500">{factura.cliente_nombre}</p>
          <p className="text-[#e8734a] font-bold tabular-nums mt-1">
            {formatCurrency(factura.total)}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Fecha de pago *</Label>
          <Input type="date" {...register('fecha_pago')} />
          {errors.fecha_pago && <p className="text-xs text-red-500">{errors.fecha_pago.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Forma de pago *</Label>
          <Select {...register('forma_pago')}>
            <option value="">Seleccionar...</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
            <option value="CHEQUE">Cheque</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="PSE">PSE</option>
          </Select>
          {errors.forma_pago && <p className="text-xs text-red-500">{errors.forma_pago.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Cuenta (opcional)</Label>
          <Input placeholder="Bancolombia 123-456789-00" {...register('cuenta')} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending || isSubmitting}>
            {registrar.isPending ? 'Guardando...' : 'Confirmar cobro'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ── CarteraPage ───────────────────────────────────────────
interface CarteraRow {
  factura:  Factura;
  semaforo: Semaforo;
  dias:     number;
}

export default function CarteraPage() {
  const navigate  = useNavigate();
  const [cobroTarget, setCobroTarget] = useState<Factura | null>(null);

  const { data: facturas = [], isLoading } = useFacturasCartera();

  const rows: CarteraRow[] = useMemo(() =>
    facturas
      .map(f => ({ factura: f, semaforo: getSemaforo(f.fecha), dias: getDias(f.fecha) }))
      .sort((a, b) => b.dias - a.dias),
    [facturas]
  );

  // KPIs
  const totalCartera    = rows.reduce((s, r) => s + r.factura.total, 0);
  const countVerde      = rows.filter(r => r.semaforo === 'verde').length;
  const countAmarillo   = rows.filter(r => r.semaforo === 'amarillo').length;
  const countRojo       = rows.filter(r => r.semaforo === 'rojo').length;
  const valorVencido    = rows.filter(r => r.semaforo === 'rojo').reduce((s, r) => s + r.factura.total, 0);

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Cartera"
        description={`${rows.length} factura${rows.length !== 1 ? 's' : ''} pendiente${rows.length !== 1 ? 's' : ''} de cobro`}
        breadcrumbs={[{ label: 'Cartera' }]}
      />

      {/* ── KPIs ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: 'Total cartera',   value: formatCurrency(totalCartera), color: 'text-gray-800' },
          { label: 'Al día (< 30d)',  value: countVerde.toString(),        color: 'text-green-600' },
          { label: 'Por vencer',      value: countAmarillo.toString(),     color: 'text-amber-600' },
          { label: 'Vencidas (> 60d)', value: `${countRojo} · ${formatCurrency(valorVencido)}`, color: 'text-red-600' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-lg font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── TABLA SEMÁFORO ────────────────────── */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-lg font-medium">¡Cartera limpia!</p>
          <p className="text-sm mt-1">No hay facturas pendientes de cobro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(row => (
            <div
              key={row.factura.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-4 hover:border-gray-300 transition-colors"
            >
              {/* Semáforo dot */}
              <div className="flex flex-col items-center gap-1 min-w-[52px]">
                <span
                  className={`h-4 w-4 rounded-full ${SEMAFORO_STYLE[row.semaforo]}`}
                  title={SEMAFORO_LABEL[row.semaforo]}
                />
                <span className="text-xs text-gray-400">{row.dias}d</span>
              </div>

              {/* Factura info */}
              <div className="flex-1 min-w-[160px]">
                <p className="font-mono font-semibold text-[#1a1a2e]">{row.factura.numero}</p>
                <p className="text-sm text-gray-500">{formatDate(row.factura.fecha)}</p>
              </div>

              {/* Cliente */}
              <div className="flex-1 min-w-[160px]">
                <p className="font-medium text-sm">{row.factura.cliente_nombre}</p>
                {row.factura.remision && (
                  <p className="text-xs text-[#e8734a] font-mono">
                    {row.factura.remision}
                  </p>
                )}
              </div>

              {/* Totales */}
              <div className="text-right min-w-[120px]">
                <p className="font-bold tabular-nums text-[#1a1a2e]">{formatCurrency(row.factura.total)}</p>
                {(row.factura.rete_fuente + row.factura.rete_ica) > 0 && (
                  <p className="text-xs text-gray-400 tabular-nums">
                    Ret: − {formatCurrency(row.factura.rete_fuente + row.factura.rete_ica)}
                  </p>
                )}
              </div>

              {/* Estado semáforo badge */}
              <div className="min-w-[90px]">
                <span className={`
                  inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                  ${row.semaforo === 'verde'    ? 'bg-green-100 text-green-700' : ''}
                  ${row.semaforo === 'amarillo' ? 'bg-amber-100 text-amber-700' : ''}
                  ${row.semaforo === 'rojo'     ? 'bg-red-100   text-red-700'   : ''}
                `}>
                  {SEMAFORO_LABEL[row.semaforo]}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/facturacion')}
                >
                  Ver FE
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCobroTarget(row.factura)}
                >
                  Registrar cobro
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CobroModal
        factura={cobroTarget}
        onClose={() => setCobroTarget(null)}
      />
    </div>
  );
}
