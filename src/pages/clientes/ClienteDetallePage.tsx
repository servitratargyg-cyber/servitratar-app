import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, ClipboardList, Plus, Trash2, MessageCircle, Mail, Phone, X, Download } from 'lucide-react';
import { useCliente } from '../../hooks/useClientes';
import { useOrdenes } from '../../hooks/useOrdenes';
import { useContactos, useCreateContacto, useDeleteContacto } from '../../hooks/useContactos';
import type { Orden } from '../../types/supabase.types';
import { getEmpresaConfig } from '../../services/config.service';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { downloadCSV } from '../../lib/csv';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ClienteForm } from './ClienteForm';

export default function ClienteDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { prefijo }  = getEmpresaConfig();
  const [editOpen,       setEditOpen]       = useState(false);
  const [addingContact,  setAddingContact]  = useState(false);
  const [cNombre,        setCNombre]        = useState('');
  const [cEmail,         setCEmail]         = useState('');
  const [cTelefono,      setCTelefono]      = useState('');

  const { data: cliente, isLoading: clienteLoading } = useCliente(id);
  const { data: ordenes = [], isLoading: ordenesLoading } = useOrdenes({ cliente_id: id });
  const { data: contactos = [] } = useContactos(id);
  const crearContacto  = useCreateContacto(id ?? '');
  const borrarContacto = useDeleteContacto(id ?? '');

  const stats = useMemo(() => ({
    totalOrdenes:  ordenes.length,
    valorTotal:    ordenes.reduce((s, o) => s + o.valor + o.iva, 0),
    valorCobrado:  ordenes
      .filter(o => o.estado === 'PAGADA')
      .reduce((s, o) => s + o.valor + o.iva, 0),
    enCartera:     ordenes
      .filter(o => o.estado === 'FE REGISTRADA')
      .reduce((s, o) => s + o.valor + o.iva, 0),
    pendientes:    ordenes.filter(o => ['RECIBIDA', 'EN PROCESO', 'ENTREGADA'].includes(o.estado)).length,
  }), [ordenes]);

  if (clienteLoading) return <PageLoader />;

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500">No se encontró el cliente.</p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  function whatsappUrl(tel: string) {
    const digits = tel.replace(/\D/g, '');
    const number = digits.startsWith('57') ? digits : `57${digits}`;
    return `https://wa.me/${number}`;
  }

  async function handleGuardarContacto() {
    if (!cNombre.trim() || !cTelefono.trim()) return;
    await crearContacto.mutateAsync({ nombre: cNombre.trim(), email: cEmail.trim(), telefono: cTelefono.trim() });
    setCNombre(''); setCEmail(''); setCTelefono('');
    setAddingContact(false);
  }

  const ordenColumns: Column<Orden>[] = [
    {
      key:      'no_doc',
      header:   'No. TT',
      cell:     row => (
        <span className="font-mono font-semibold text-[#e8734a]">{prefijo}{row.no_doc}</span>
      ),
    },
    { key: 'fecha',  header: 'Fecha',   cell: row => formatDate(row.fecha) },
    { key: 'tipo',   header: 'Tipo',    cell: row => <span className="text-xs">{row.tipo_doc}</span> },
    {
      key:  'valor',
      header: 'Total',
      cell: row => (
        <span className="tabular-nums font-medium">{formatCurrency(row.valor + row.iva)}</span>
      ),
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StatusBadge estado={row.estado} />,
    },
    {
      key:  'actions',
      header: '',
      cell: row => (
        <Button
          variant="ghost"
          size="sm"
          onClick={e => { e.stopPropagation(); navigate(`/ordenes/${row.id}`); }}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={cliente.nombre}
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: cliente.nombre },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/clientes')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </div>
        }
      />

      {/* ── KPI CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
        {[
          { label: 'Total órdenes',   value: stats.totalOrdenes.toString(),        color: 'text-gray-800' },
          { label: 'Valor total',     value: formatCurrency(stats.valorTotal),      color: 'text-gray-800' },
          { label: 'Cobrado',         value: formatCurrency(stats.valorCobrado),    color: 'text-green-600' },
          { label: 'En cartera',      value: formatCurrency(stats.enCartera),       color: 'text-orange-600' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-gray-500">Nombre</dt>
              <dd className="font-medium">{cliente.nombre}</dd>

              {cliente.razon_social && (
                <>
                  <dt className="text-gray-500">Razón social</dt>
                  <dd>{cliente.razon_social}</dd>
                </>
              )}

              {cliente.nit && (
                <>
                  <dt className="text-gray-500">NIT</dt>
                  <dd className="font-mono">{cliente.nit}</dd>
                </>
              )}

              {cliente.telefono && (
                <>
                  <dt className="text-gray-500">Teléfono</dt>
                  <dd>{cliente.telefono}</dd>
                </>
              )}

              {cliente.email && (
                <>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="truncate">{cliente.email}</dd>
                </>
              )}

              {cliente.direccion && (
                <>
                  <dt className="text-gray-500">Dirección</dt>
                  <dd>{cliente.direccion}</dd>
                </>
              )}

              <dt className="text-gray-500">Ciudad</dt>
              <dd>{cliente.ciudad ?? 'BOGOTÁ'}</dd>

              {cliente.convenio && (
                <>
                  <dt className="text-gray-500">Convenio</dt>
                  <dd>{cliente.convenio}</dd>
                </>
              )}

              <dt className="text-gray-500">Modo cobro</dt>
              <dd className="font-mono">{cliente.modo_cobro}</dd>

              <dt className="text-gray-500">Tipo doc.</dt>
              <dd>{cliente.tipo_doc}</dd>

              <dt className="text-gray-500">Tarifa defecto</dt>
              <dd className="tabular-nums">{formatCurrency(cliente.tarifa_defecto)}/{cliente.modo_cobro === 'KG' ? 'kg' : 'und'}</dd>

              <dt className="text-gray-500">Retenciones</dt>
              <dd>{cliente.aplica_ret ? 'Sí' : 'No'}</dd>

              <dt className="text-gray-500">Estado</dt>
              <dd><StatusBadge estado={cliente.estado} /></dd>

              <dt className="text-gray-500">Registrado</dt>
              <dd>{formatDate(cliente.created_at)}</dd>
            </dl>
          </CardContent>
        </Card>

        {/* Resumen actividad */}
        <Card>
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Órdenes pendientes</span>
                <span className="font-semibold">{stats.pendientes}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Órdenes pagadas</span>
                <span className="font-semibold text-green-600">
                  {ordenes.filter(o => o.estado === 'PAGADA').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-500">Última orden</span>
                <span className="font-medium">
                  {ordenes[0]
                    ? `${prefijo}${ordenes[0].no_doc} — ${formatDate(ordenes[0].fecha)}`
                    : '—'}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-4"
              onClick={() => navigate(`/ordenes?cliente_id=${cliente.id}`)}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Ver todas las órdenes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── CONTACTOS ──────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contactos</CardTitle>
            <div className="flex gap-2">
              {contactos.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCSV(
                    `contactos_${cliente.nombre.replace(/\s+/g, '_')}`,
                    ['Nombre', 'Teléfono', 'Email'],
                    contactos.map(c => [c.nombre, c.telefono, c.email ?? ''])
                  )}
                >
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
              )}
              {!addingContact && (
                <Button size="sm" variant="outline" onClick={() => setAddingContact(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulario inline */}
          {addingContact && (
            <div className="mb-4 p-4 rounded-lg border border-[#e8734a]/30 bg-orange-50 flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">Nuevo contacto</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={cNombre}
                    onChange={e => setCNombre(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Teléfono / WhatsApp *</Label>
                  <Input
                    placeholder="310 000 0000"
                    value={cTelefono}
                    onChange={e => setCTelefono(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Correo electrónico</Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={cEmail}
                    onChange={e => setCEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setAddingContact(false); setCNombre(''); setCEmail(''); setCTelefono(''); }}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!cNombre.trim() || !cTelefono.trim() || crearContacto.isPending}
                  onClick={handleGuardarContacto}
                >
                  {crearContacto.isPending ? 'Guardando...' : 'Guardar contacto'}
                </Button>
              </div>
            </div>
          )}

          {/* Lista de contactos */}
          {contactos.length === 0 && !addingContact ? (
            <p className="text-sm text-gray-400 italic text-center py-6">
              No hay contactos registrados para este cliente.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {contactos.map(c => {
                const iniciales = c.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={c.id} className="flex items-center gap-4 py-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {iniciales}
                    </div>

                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{c.nombre}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" /> {c.telefono}
                        </span>
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={whatsappUrl(c.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      )}
                      <button
                        onClick={() => borrarContacto.mutate(c.id)}
                        disabled={borrarContacto.isPending}
                        className="ml-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar contacto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de órdenes */}
      <Card className="mt-5">
        <CardHeader><CardTitle>Historial de órdenes</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={ordenColumns}
            data={ordenes}
            loading={ordenesLoading}
            pageSize={10}
            emptyMessage="Este cliente no tiene órdenes aún"
            onRowClick={row => navigate(`/ordenes/${row.id}`)}
          />
        </CardContent>
      </Card>

      <ClienteForm open={editOpen} onClose={() => setEditOpen(false)} cliente={cliente} />
    </div>
  );
}
