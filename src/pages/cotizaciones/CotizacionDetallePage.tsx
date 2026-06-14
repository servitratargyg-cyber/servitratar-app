import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, Send, Mail } from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import { useCotizacion, useUpdateCotizacionEstado, useConvertirAOrden } from '../../hooks/useCotizaciones';
import { useAuth, usePermissions } from '../../hooks/useAuth';
import { useCliente } from '../../hooks/useClientes';
import type { CotizacionConItems } from '../../services/cotizaciones.service';
import { getEmpresaConfig } from '../../services/config.service';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { abrirMailto } from '../../lib/email';
import { CotizacionPDF } from '../../pdf/CotizacionPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function CotizacionDetallePage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can }  = usePermissions();

  const { data, isLoading, error } = useCotizacion(id);
  const updateEstado  = useUpdateCotizacionEstado();
  const convertirAOS  = useConvertirAOrden(user?.id ?? null);
  const { data: cliente } = useCliente(data?.cliente_id ?? undefined);

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500">No se encontró la cotización.</p>
        <Button variant="outline" onClick={() => navigate('/cotizaciones')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const cotizacion: CotizacionConItems = data;

  async function descargarPDF() {
    const blob = await pdf(
      <CotizacionPDF cotizacion={cotizacion} items={cotizacion.items} />
    ).toBlob();
    saveAs(blob, `${cotizacion.numero}.pdf`);
  }

  async function enviarPorEmail() {
    await descargarPDF();
    const { nombre } = getEmpresaConfig();
    abrirMailto({
      to:      cliente?.email ?? '',
      subject: `Cotización ${cotizacion.numero} — ${nombre}`,
      body:
        `Estimado/a ${cotizacion.cliente_nombre},\n\n` +
        `Adjunto encontrará la cotización ${cotizacion.numero} por un valor de ` +
        `${formatCurrency(cotizacion.total)}.\n\n` +
        `Quedamos atentos a cualquier inquietud.\n\n` +
        `${nombre}`,
    });
  }

  async function handleConvertir() {
    const result = await convertirAOS.mutateAsync(cotizacion.id);
    if (result?.data) {
      navigate(`/ordenes/${result.data.ordenId}`);
    }
  }

  const isBorrador  = cotizacion.estado === 'BORRADOR';
  const isEnviada   = cotizacion.estado === 'ENVIADA';

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={cotizacion.numero}
        breadcrumbs={[
          { label: 'Cotizaciones', href: '/cotizaciones' },
          { label: cotizacion.numero },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/cotizaciones')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Button variant="outline" onClick={descargarPDF}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" onClick={enviarPorEmail}>
              <Mail className="h-4 w-4 mr-1" /> Enviar por email
            </Button>
          </div>
        }
      />

      {/* ── ESTADO + ACCIONES ──────────────────── */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatusBadge estado={cotizacion.estado} />
              {cotizacion.fecha_validez && (
                <span className="text-sm text-gray-500">
                  Válida hasta: <strong>{formatDate(cotizacion.fecha_validez)}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isBorrador && can.crearOrdenes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateEstado.mutate({ id: cotizacion.id, estado: 'ENVIADA' })}
                  disabled={updateEstado.isPending}
                >
                  <Send className="h-4 w-4 mr-1" /> Marcar Enviada
                </Button>
              )}

              {isEnviada && can.crearOrdenes && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => updateEstado.mutate({ id: cotizacion.id, estado: 'RECHAZADA' })}
                    disabled={updateEstado.isPending || convertirAOS.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleConvertir}
                    disabled={convertirAOS.isPending || updateEstado.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {convertirAOS.isPending ? 'Creando OS...' : 'Aprobar y crear OS'}
                  </Button>
                </>
              )}

              {cotizacion.orden_id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/ordenes/${cotizacion.orden_id}`)}
                >
                  Ver OS vinculada →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── DATOS GENERALES ────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-5">
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-gray-500">Número</dt>
              <dd className="font-mono font-semibold text-[#e8734a]">{cotizacion.numero}</dd>

              <dt className="text-gray-500">Fecha</dt>
              <dd>{formatDate(cotizacion.fecha)}</dd>

              <dt className="text-gray-500">Cliente</dt>
              <dd className="font-medium">{cotizacion.cliente_nombre}</dd>

              <dt className="text-gray-500">Modo cobro</dt>
              <dd className="font-mono">{cotizacion.modo_cobro}</dd>

              <dt className="text-gray-500">Válida hasta</dt>
              <dd>{cotizacion.fecha_validez ? formatDate(cotizacion.fecha_validez) : '—'}</dd>

              <dt className="text-gray-500">Estado</dt>
              <dd><StatusBadge estado={cotizacion.estado} /></dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="tabular-nums font-medium">{formatCurrency(cotizacion.subtotal)}</span>
              </div>
              {cotizacion.iva > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA (19%)</span>
                  <span className="tabular-nums font-medium">{formatCurrency(cotizacion.iva)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="font-semibold">Total cotizado</span>
                <span className="font-bold text-xl text-[#e8734a] tabular-nums">
                  {formatCurrency(cotizacion.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── ÍTEMS ──────────────────────────────── */}
      <Card className="mb-5">
        <CardHeader><CardTitle>Ítems cotizados</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="pb-2 text-left font-medium w-8">#</th>
                  <th className="pb-2 text-left font-medium w-20">Cant.</th>
                  <th className="pb-2 text-left font-medium">Descripción</th>
                  <th className="pb-2 text-left font-medium w-32">Referencia</th>
                  <th className="pb-2 text-left font-medium w-24">Dureza</th>
                  <th className="pb-2 text-right font-medium w-32">V. Unit.</th>
                  <th className="pb-2 text-right font-medium w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotizacion.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-400">{item.posicion}</td>
                    <td className="py-2 tabular-nums">{item.cantidad ?? '—'}</td>
                    <td className="py-2 font-medium">{item.descripcion ?? ''}</td>
                    <td className="py-2 text-gray-600">{item.referencia ?? '—'}</td>
                    <td className="py-2 text-gray-600">{item.dureza ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(item.tarifa_unit)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── NOTAS ──────────────────────────────── */}
      {cotizacion.notas && (
        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cotizacion.notas}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
