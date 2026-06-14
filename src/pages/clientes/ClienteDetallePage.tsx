import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, ClipboardList } from 'lucide-react';
import { useCliente } from '../../hooks/useClientes';
import { useOrdenes } from '../../hooks/useOrdenes';
import type { Orden } from '../../types/supabase.types';
import { getEmpresaConfig } from '../../services/config.service';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ClienteForm } from './ClienteForm';

export default function ClienteDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { prefijo }  = getEmpresaConfig();
  const [editOpen, setEditOpen] = useState(false);

  const { data: cliente, isLoading: clienteLoading } = useCliente(id);
  const { data: ordenes = [], isLoading: ordenesLoading } = useOrdenes({ cliente_id: id });

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
