import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Download, ArrowLeft, Truck, CreditCard, Ban, RefreshCw, Mail, MessageSquarePlus, History, FileText } from 'lucide-react';
import { useOrden, useCambiarEstadoOrden, useOrdenHistorial } from '../../hooks/useOrdenes';
import { useFacturaPorNumero } from '../../hooks/useFacturas';
import { useAuth, usePermissions } from '../../hooks/useAuth';
import { useOrdenNotas, useAddOrdenNota } from '../../hooks/useOrdenNotas';
import { useCliente } from '../../hooks/useClientes';
import { useContactos } from '../../hooks/useContactos';
import { updateOrdenPdfUrl, uploadOrdenPDF, type OrdenConItems, ESTADO_IDX } from '../../services/ordenes.service';
import type { Orden } from '../../types/supabase.types';
import { getEmpresaConfig } from '../../services/config.service';
import { ESTADOS_ORDEN } from '../../lib/constants';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { abrirMailto } from '../../lib/email';
import { OrdenPDF } from '../../pdf/OrdenPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ContactoEmailDialog } from '../../components/shared/ContactoEmailDialog';

// Valid next-estado transitions for non-admin
const NEXT_STATES: Partial<Record<Orden['estado'], Orden['estado'][]>> = {
  RECIBIDA:     ['EN PROCESO', 'ENTREGADA'],
  'EN PROCESO': ['ENTREGADA'],
};

export default function OrdenDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { profile }  = useAuth();
  const { isAdmin }  = usePermissions();

  const { data, isLoading, error } = useOrden(id);
  const cambiarEstado             = useCambiarEstadoOrden();
  const { data: notas = [] }      = useOrdenNotas(id);
  const addNota                   = useAddOrdenNota(id ?? '');
  const { data: historial = [] }  = useOrdenHistorial(id);
  const { prefijo, nombre }       = getEmpresaConfig();
  const { data: cliente }         = useCliente(data?.cliente_id ?? undefined);
  const { data: contactos = [] }  = useContactos(data?.cliente_id ?? undefined);
  const { data: facturaFE }       = useFacturaPorNumero(data?.no_factura);

  const [showPagoModal,       setShowPagoModal]       = useState(false);
  const [showEntregaModal,    setShowEntregaModal]    = useState(false);
  const [showAnularDialog,    setShowAnularDialog]    = useState(false);
  const [showEstadoModal,     setShowEstadoModal]     = useState(false);
  const [showContactoDialog,  setShowContactoDialog]  = useState(false);
  const [pdfLoading,          setPdfLoading]          = useState(false);

  const [fechaPago,       setFechaPago]       = useState('');
  const [formaPago,       setFormaPago]       = useState('TRANSFERENCIA');
  const [fechaEntrega,    setFechaEntrega]    = useState('');
  const [nuevoEstado,     setNuevoEstado]     = useState<Orden['estado'] | ''>('');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [notaHistorial,   setNotaHistorial]   = useState('');
  const [nuevaNota,       setNuevaNota]       = useState('');

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

  const noDocLabel = `${prefijo}${orden.no_doc}`;
  const total      = orden.valor + orden.iva;

  const nextStates        = NEXT_STATES[orden.estado] ?? [];
  const estadosDisponibles: Orden['estado'][] = isAdmin
    ? (ESTADOS_ORDEN.filter(s => s !== orden.estado) as Orden['estado'][])
    : nextStates;
  const canChangeEstado = estadosDisponibles.length > 0;
  const canAnular  = isAdmin && !['PAGADA', 'ANULADA'].includes(orden.estado);
  const canEntrega = ['RECIBIDA', 'EN PROCESO'].includes(orden.estado);
  const canPago    = ['ENTREGADA', 'FE REGISTRADA'].includes(orden.estado);

  // Advertencias para el modal de cambio de estado (admin)
  const estadoModalWarnings: string[] = (() => {
    if (!nuevoEstado || !isAdmin) return [];
    const toIdx = ESTADO_IDX[nuevoEstado] ?? -1;
    const ws: string[] = [];
    if (toIdx >= 0 && ESTADO_IDX['FE REGISTRADA'] > toIdx && orden.no_factura) {
      ws.push(`La factura ${orden.no_factura} quedará en el módulo de Facturación. Anúlala desde allí si es necesario.`);
    }
    if (toIdx >= 0 && ESTADO_IDX['PAGADA'] > toIdx && orden.fecha_pago) {
      ws.push('Se eliminará el registro de pago directo de la orden (fecha y forma de pago).');
    }
    if (orden.estado === 'ANULADA') {
      ws.push('La orden volverá a estar activa en el flujo de trabajo.');
    }
    return ws;
  })();

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

  function handleEnviarEmail() {
    const tieneOpciones = contactos.some(c => c.email) || !!cliente?.email;
    if (tieneOpciones) {
      setShowContactoDialog(true);
    } else {
      enviarEmailA('');
    }
  }

  async function enviarEmailA(email: string) {
    await handleDownloadPDF();
    abrirMailto({
      to:      email,
      subject: `Orden de servicio ${noDocLabel} — ${nombre}`,
      body:
        `Estimado/a ${orden.cliente_nombre},\n\n` +
        `Adjunto encontrará la orden de servicio ${noDocLabel}` +
        ` por un valor de ${formatCurrency(orden.valor + orden.iva)}.\n\n` +
        `Quedamos atentos a cualquier inquietud.\n\n` +
        `${nombre}`,
    });
  }

  function resetEstadoModal() {
    setShowEstadoModal(false);
    setNuevoEstado('');
    setNotaHistorial('');
    setFechaEntrega('');
    setFechaPago('');
    setFormaPago('TRANSFERENCIA');
    setMotivoAnulacion('');
  }

  async function handleCambiarEstado() {
    if (!nuevoEstado) return;

    if (isAdmin) {
      if (nuevoEstado === 'PAGADA' && !fechaPago) { toast.error('Ingresa la fecha de pago'); return; }
      if (nuevoEstado === 'ANULADA' && !motivoAnulacion.trim()) { toast.error('Ingresa el motivo de anulación'); return; }
    }

    const datosExtra: Record<string, string> = {};
    if (isAdmin) {
      if (nuevoEstado === 'ENTREGADA' && fechaEntrega) datosExtra.fecha_entrega = fechaEntrega;
      if (nuevoEstado === 'PAGADA') { datosExtra.fecha_pago = fechaPago; datosExtra.forma_pago = formaPago; }
      if (nuevoEstado === 'ANULADA') datosExtra.motivo_anulacion = motivoAnulacion.trim();
    }

    await cambiarEstado.mutateAsync({
      orden,
      nuevoEstado,
      datosExtra,
      usuarioNombre: profile?.full_name ?? 'Usuario',
      nota: notaHistorial.trim() || undefined,
    });
    resetEstadoModal();
  }

  async function handleRegistrarEntrega() {
    if (!fechaEntrega) { toast.error('Ingresa la fecha de entrega'); return; }
    await cambiarEstado.mutateAsync({
      orden,
      nuevoEstado: 'ENTREGADA',
      datosExtra:  { fecha_entrega: fechaEntrega },
      usuarioNombre: profile?.full_name ?? 'Usuario',
    });
    setShowEntregaModal(false);
    setFechaEntrega('');
  }

  async function handleRegistrarPago() {
    if (!fechaPago) { toast.error('Ingresa la fecha de pago'); return; }
    await cambiarEstado.mutateAsync({
      orden,
      nuevoEstado: 'PAGADA',
      datosExtra:  { fecha_pago: fechaPago, forma_pago: formaPago },
      usuarioNombre: profile?.full_name ?? 'Usuario',
    });
    setShowPagoModal(false);
    setFechaPago('');
  }

  async function handleAddNota() {
    if (!nuevaNota.trim()) return;
    await addNota.mutateAsync({
      texto:       nuevaNota.trim(),
      autorNombre: profile?.full_name ?? 'Usuario',
    });
    setNuevaNota('');
  }

  async function handleAnular() {
    if (!motivoAnulacion.trim()) { toast.error('Ingresa el motivo de anulación'); return; }
    await cambiarEstado.mutateAsync({
      orden,
      nuevoEstado:  'ANULADA',
      datosExtra:   { motivo_anulacion: motivoAnulacion.trim() },
      usuarioNombre: profile?.full_name ?? 'Admin',
    });
    setShowAnularDialog(false);
    setMotivoAnulacion('');
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
              {pdfLoading ? 'Generando...' : 'PDF'}
            </Button>
            <Button variant="outline" onClick={handleEnviarEmail} disabled={pdfLoading}>
              <Mail className="h-4 w-4 mr-1" /> Enviar por email
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

        {canChangeEstado && (
          <Button variant="secondary" size="sm" onClick={() => setShowEstadoModal(true)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {isAdmin ? 'Cambiar estado' : 'Avanzar estado'}
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
                  <dd className="font-mono flex items-center gap-2">
                    {orden.no_factura === 'SIN' ? (
                      <span className="text-gray-400">Sin factura</span>
                    ) : (
                      <>
                        {orden.no_factura}
                        {facturaFE?.pdf_url && (
                          <a
                            href={facturaFE.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver PDF de la factura electrónica"
                            className="inline-flex items-center gap-1 text-[#e8734a] hover:underline text-xs font-normal"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Ver FE
                          </a>
                        )}
                      </>
                    )}
                  </dd>
                </>
              )}
              {orden.estado === 'ANULADA' && (
                <>
                  <dt className="text-gray-500">Fecha anulación</dt>
                  <dd className="text-red-600 font-medium">{formatDate(orden.updated_at)}</dd>
                  {orden.motivo_anulacion && (
                    <>
                      <dt className="text-gray-500 col-span-2 pt-1 border-t border-gray-100 mt-1">Motivo de anulación</dt>
                      <dd className="col-span-2 text-red-700 bg-red-50 rounded-md px-3 py-2 text-sm whitespace-pre-wrap">
                        {orden.motivo_anulacion}
                      </dd>
                    </>
                  )}
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Categoría</th>
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
                    <td className="px-3 py-2.5 text-gray-600">{item.categoria ?? '—'}</td>
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

      {/* Notas / avances */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-gray-500" />
            Observaciones y avances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Lista de notas */}
          {notas.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">Sin observaciones registradas.</p>
          ) : (
            <ol className="mb-4 space-y-3">
              {notas.map(nota => (
                <li key={nota.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#e8734a]" />
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{nota.texto}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {nota.autor_nombre} · {new Date(nota.created_at).toLocaleString('es-CO', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* Formulario nueva nota */}
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Escribe una observación o avance..."
              rows={2}
              value={nuevaNota}
              onChange={e => setNuevaNota(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNota();
              }}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddNota}
                disabled={!nuevaNota.trim() || addNota.isPending}
              >
                {addNota.isPending ? 'Guardando...' : 'Agregar nota'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de estados */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            Historial de estados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cambios de estado registrados.</p>
          ) : (
            <ol className="space-y-3">
              {historial.map(h => (
                <li key={h.id} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-xs text-gray-400 font-mono">{h.estado_desde}</span>
                      <span className="text-gray-300 text-xs">→</span>
                      <StatusBadge estado={h.estado_hasta as Orden['estado']} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.usuario_nombre} · {new Date(h.created_at).toLocaleString('es-CO', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {h.nota && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{h.nota}"</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* ── MODALES ─────────────────────────────── */}

      <Dialog open={showEstadoModal} onClose={resetEstadoModal} title={isAdmin ? 'Cambiar estado (admin)' : 'Avanzar estado'}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nuevo estado</Label>
            <Select value={nuevoEstado} onChange={e => { setNuevoEstado(e.target.value as Orden['estado']); setFechaEntrega(''); setFechaPago(''); setFormaPago('TRANSFERENCIA'); setMotivoAnulacion(''); }}>
              <option value="">Selecciona...</option>
              {estadosDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          {/* Campos extra según estado seleccionado (solo admin) */}
          {isAdmin && nuevoEstado === 'ENTREGADA' && (
            <div className="flex flex-col gap-1.5">
              <Label>Fecha de entrega <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
            </div>
          )}
          {isAdmin && nuevoEstado === 'PAGADA' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Fecha de pago *</Label>
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
            </>
          )}
          {isAdmin && nuevoEstado === 'ANULADA' && (
            <div className="flex flex-col gap-1.5">
              <Label>Motivo de anulación *</Label>
              <Textarea
                placeholder="Describe el motivo..."
                rows={2}
                value={motivoAnulacion}
                onChange={e => setMotivoAnulacion(e.target.value)}
              />
            </div>
          )}

          {/* Nota para historial (solo admin) */}
          {isAdmin && nuevoEstado && (
            <div className="flex flex-col gap-1.5">
              <Label>Nota del cambio <span className="text-gray-400 font-normal">(opcional, queda en historial)</span></Label>
              <Input
                placeholder="Ej: corrección de estado por error de captura"
                value={notaHistorial}
                onChange={e => setNotaHistorial(e.target.value)}
              />
            </div>
          )}

          {/* Advertencias */}
          {estadoModalWarnings.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <p className="font-semibold mb-1">Ten en cuenta:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {estadoModalWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetEstadoModal}>Cancelar</Button>
            <Button onClick={handleCambiarEstado} disabled={!nuevoEstado || cambiarEstado.isPending}>
              {cambiarEstado.isPending ? 'Actualizando...' : 'Confirmar cambio'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showEntregaModal} onClose={() => { setShowEntregaModal(false); setFechaEntrega(''); }} title="Registrar fecha de entrega">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de entrega</Label>
            <Input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowEntregaModal(false); setFechaEntrega(''); }}>Cancelar</Button>
            <Button onClick={handleRegistrarEntrega} disabled={cambiarEstado.isPending}>
              {cambiarEstado.isPending ? 'Guardando...' : 'Registrar entrega'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={showPagoModal} onClose={() => { setShowPagoModal(false); setFechaPago(''); }} title="Registrar pago directo">
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
            <Button variant="outline" onClick={() => { setShowPagoModal(false); setFechaPago(''); }}>Cancelar</Button>
            <Button onClick={handleRegistrarPago} disabled={cambiarEstado.isPending}>
              {cambiarEstado.isPending ? 'Guardando...' : 'Registrar pago'}
            </Button>
          </div>
        </div>
      </Dialog>

      <ContactoEmailDialog
        open={showContactoDialog}
        onClose={() => setShowContactoDialog(false)}
        contactos={contactos}
        emailGeneral={cliente?.email}
        onSelect={email => enviarEmailA(email)}
      />

      <Dialog
        open={showAnularDialog}
        onClose={() => { setShowAnularDialog(false); setMotivoAnulacion(''); }}
        title={`Anular orden ${noDocLabel}`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Esta acción anulará la orden <strong>{noDocLabel}</strong>. El número no se reutilizará.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>Motivo de anulación *</Label>
            <Textarea
              placeholder="Describe el motivo por el cual se anula esta orden..."
              rows={3}
              value={motivoAnulacion}
              onChange={e => setMotivoAnulacion(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowAnularDialog(false); setMotivoAnulacion(''); }}
              disabled={cambiarEstado.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnular}
              disabled={cambiarEstado.isPending || !motivoAnulacion.trim()}
            >
              {cambiarEstado.isPending ? 'Anulando...' : 'Confirmar anulación'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
