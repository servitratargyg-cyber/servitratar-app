import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  Download, ArrowLeft, Truck, CreditCard, Ban, RefreshCw,
} from 'lucide-react';
import { useOrden, useUpdateOrdenEstado } from '../../hooks/useOrdenes';
import { usePermissions } from '../../hooks/useAuth';
import { updateOrdenPdfUrl, uploadOrdenPDF, type OrdenConItems } from '../../services/ordenes.service';
import type { Orden } from '../../types/supabase.types';
import { EMPRESA } from '../../lib/constants';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { OrdenPDF } from '../../pdf/OrdenPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// Valid estado transitions
const NEXT_STATES: Partial<Record<Orden['estado'], Orden['estado'][]>> = {
  RECIBIDA:     ['EN PROCESO', 'ENTREGADA'],
  'EN PROCESO': ['ENTREGADA'],
  ENTREGADA:    [],
};

export default function OrdenDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { isAdmin }  = usePermissions();

  const { data, isLoading, error } = useOrden(id);
  const updateEstado = useUpdateOrdenEstado();

  const [showPagoModal,    setShowPagoModal]    = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [showAnularDialog, setShowAnularDialog] = useState(false);
  const [showEstadoModal,  setShowEstadoModal]  = useState(false);
  const [pdfLoading,       setPdfLoading]       = useState(false);

  const [fechaPago,    setFechaPago]    = useState('');
  const [formaPago,    setFormaPago]    = useState('TRANSFERENCIA');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [nuevoEstado,  setNuevoEstado]  = useState<Orden['estado'] | ''>('');

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500">No se encontró la orden.</p>
        <Button variant="outline" onClick={() => navigate('/ordenes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  // Narrow: at this point data is OrdenConItems
  const orden: OrdenConItems = data;

  const noDocLabel = `${EMPRESA.prefijo}${orden.no_doc}`;
  const total      = orden.valor + orden.iva;
  const nextStates = NEXT_STATES[orden.estado] ?? [];
  const canAnular  = isAdmin && !['PAGADA', 'ANULADA'].includes(orden.estado);
  const canEntrega = ['RECIBIDA', 'EN PROCESO'].includes(orden.estado);
  const canPago    = ['ENTREGADA', 'FE REGISTRADA'].includes(orden.estado);

  async function handleDownloadPDF() {
    setPdfLoading(true);
    try {
      const blob = await pdf(
        <OrdenPDF orden={orden} items={orden.items} />
      ).toBlob();

      if (!orden.pdf_url) {
        const pdfUrl = await uploadOrdenPDF(blob, orden.no_doc);
        if (pdfUrl) await updateOrdenPdfUrl(orden.id, pdfUrl);
      }

      saveAs(blob, `${noDocLabel}.pdf`);
    } catch {
      toast.error('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleCambiarEstado() {
    if (!nuevoEstado) return;
    await updateEstado.mutateAsync({ id: orden.id, estado: nuevoEstado });
    setShowEstadoModal(false);
    setNuevoEstado('');
  }

  async function handleRegistrarEntrega() {
    if (!fechaEntrega) { toast.error('Ingresa la fecha de entrega'); return; }
    await updateEstado.mutateAsync({
      id: orden.id, estado: 'ENTREGADA', extra: { fecha_entrega: fechaEntrega },
    });
    setShowEntregaModal(false);
  }

  async function handleRegistrarPago() {
    if (!fechaPago) { toast.error('Ingresa la fecha de pago'); return; }
    await updateEstado.mutateAsync({
      id: orden.id, estado: 'PAGADA', extra: { fecha_pago: fechaPago, forma_pago: formaPago },
    });
    setShowPagoModal(false);
  }

  async function handleAnular() {
    await updateEstado.mutateAsync({ id: orden.id, estado: 'ANULADA' });
    setShowAnularDialog(false);
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Orden ${noDocLabel}`}
        breadcrumbs={[
          { label: 'Órdenes', href: '/ordenes' },
          { label: noDocLabel },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/ordenes')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={pdfLoading}>
              <Download className="h-4 w-4 mr-1" />
              {pdfLoading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
        }
      />

      {/* Estado + acciones rápidas */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Estado:</span>
          <StatusBadge estado={orden.estado} />
        </div>
        <div className="flex-1" />

        {nextStates.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setShowEstadoModal(true)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Cambiar estado
          </Button>
        )}
        {canEntrega && (
          <Button variant="secondary" size="sm" onClick={() => { setFechaEntrega(''); setShowEntregaModal(true); }}>
            <Truck className="h-4 w-4 mr-1" /> Registrar entrega
          </Button>
        )}
        {canPago && (
          <Button variant="secondary" size="sm" onClick={() => { setFechaPago(''); setShowPagoModal(true); }}>
            <CreditCard className="h-4 w-4 mr-1" /> Registrar pago
          </Button>
        )}
        {canAnular && (
          <Button variant="destructive" size="sm" onClick={() => setShowAnularDialog(true)}>
            <Ban className="h-4 w-4 mr-1" /> Anular
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Info general */}
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-gray-500">No. Orden</dt>
              <dd className="font-mono font-bold text-[#e8734a]">{noDocLabel}</dd>
              <dt className="text-gray-500">Fecha</dt>
              <dd>{formatDate(orden.fecha)}</dd>
              <dt className="text-gray-500">Hora</dt>
              <dd>{orden.hora?.slice(0, 5) ?? '—'}</dd>
              <dt className="text-gray-500">Tipo doc.</dt>
              <dd>{orden.tipo_doc}</dd>
              <dt className="text-gray-500">Modo cobro</dt>
              <dd>{orden.modo_cobro}</dd>
              <dt className="text-gray-500">Cliente</dt>
              <dd className="font-medium">{orden.cliente_nombre}</dd>
              {orden.fecha_entrega && (
                <>
                  <dt className="text-gray-500">Fecha entrega</dt>
                  <dd className="text-green-700 font-medium">{formatDate(orden.fecha_entrega)}</dd>
                </>
              )}
              {orden.fecha_pago && (
                <>
                  <dt className="text-gray-500">Fecha pago</dt>
                  <dd className="text-green-700 font-medium">{formatDate(orden.fecha_pago)}</dd>
                </>
              )}
              {orden.forma_pago && (
                <>
                  <dt className="text-gray-500">Forma pago</dt>
                  <dd>{orden.forma_pago}</dd>
                </>
              )}
              {orden.no_factura && (
                <>
                  <dt className="text-gray-500">No. Factura</dt>
                  <dd className="font-mono">{orden.no_factura}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Liquidación */}
        <Card>
          <CardHeader><CardTitle>Liquidación</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {orden.modo_cobro === 'KG' ? (
                <>
                  <dt className="text-gray-500">Total KG</dt>
                  <dd className="tabular-nums">{orden.kg_total} kg</dd>
                  <dt className="text-gray-500">Tarifa/KG</dt>
                  <dd className="tabular-nums">{formatCurrency(orden.tarifa_kg)}</dd>
                </>
              ) : (
                <>
                  <dt className="text-gray-500">Cant. total</dt>
                  <dd className="tabular-nums">{orden.cant_total} uds</dd>
                </>
              )}
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(orden.valor)}</dd>
              {orden.iva > 0 && (
                <>
                  <dt className="text-gray-500">IVA (19%)</dt>
                  <dd className="tabular-nums">{formatCurrency(orden.iva)}</dd>
                </>
              )}
              <dt className="font-semibold text-gray-800">Total a pagar</dt>
              <dd className="font-bold text-lg text-[#e8734a] tabular-nums">{formatCurrency(total)}</dd>
            </dl>
            {orden.observacion && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Observaciones</p>
                <p className="text-sm text-gray-700">{orden.observacion}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ítems */}
      <Card className="mt-5">
        <CardHeader><CardTitle>Ítems de la orden</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cant.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Referencia</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dureza</th>
                  {orden.modo_cobro === 'UNIDAD' && (
                    <>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tarifa</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orden.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-400">{item.posicion}</td>
                    <td className="px-3 py-2.5 tabular-nums">{item.cantidad ?? '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{item.descripcion}</td>
                    <td className="px-3 py-2.5 text-gray-600">{item.referencia ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600">{item.dureza ?? '—'}</td>
                    {orden.modo_cobro === 'UNIDAD' && (
                      <>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(item.tarifa_unit)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(item.subtotal)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── MODALES ─────────────────────────────── */}

      <Dialog open={showEstadoModal} onClose={() => setShowEstadoModal(false)} title="Cambiar estado">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nuevo estado</Label>
            <Select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value as Orden['estado'])}>
              <option value="">Selecciona...</option>
              {nextStates.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEstadoModal(false)}>Cancelar</Button>
            <Button onClick={handleCambiarEstado} disabled={!nuevoEstado || updateEstado.isPending}>
              {updateEstado.isPending ? 'Actualizando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showEntregaModal} onClose={() => setShowEntregaModal(false)} title="Registrar fecha de entrega">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de entrega</Label>
            <Input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEntregaModal(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarEntrega} disabled={updateEstado.isPending}>
              {updateEstado.isPending ? 'Guardando...' : 'Registrar entrega'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showPagoModal} onClose={() => setShowPagoModal(false)} title="Registrar pago directo">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de pago</Label>
            <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Forma de pago</Label>
            <Select value={formaPago} onChange={e => setFormaPago(e.target.value)}>
              <option value="TRANSFERENCIA">Transferencia bancaria</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="CHEQUE">Cheque</option>
              <option value="PSE">PSE</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPagoModal(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarPago} disabled={updateEstado.isPending}>
              {updateEstado.isPending ? 'Guardando...' : 'Registrar pago'}
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={showAnularDialog}
        onClose={() => setShowAnularDialog(false)}
        onConfirm={handleAnular}
        title={`Anular orden ${noDocLabel}`}
        description={`Esta acción anulará la orden ${noDocLabel}. El número no se reutilizará. ¿Confirmas?`}
        confirmLabel="Sí, anular"
        loading={updateEstado.isPending}
      />
    </div>
  );
}
