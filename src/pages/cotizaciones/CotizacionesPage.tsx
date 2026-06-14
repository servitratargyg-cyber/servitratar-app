import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useCotizaciones } from '../../hooks/useCotizaciones';
import type { Cotizacion } from '../../types/supabase.types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';

export default function CotizacionesPage() {
  const navigate = useNavigate();
  const { data: cotizaciones = [], isLoading } = useCotizaciones();

  const columns: Column<Cotizacion>[] = [
    {
      key:      'numero',
      header:   'Número',
      accessor: 'numero',
      sortable: true,
      cell:     row => (
        <span className="font-mono font-semibold text-[#e8734a]">{row.numero}</span>
      ),
    },
    {
      key:      'fecha',
      header:   'Fecha',
      accessor: 'fecha',
      sortable: true,
      cell:     row => formatDate(row.fecha),
    },
    {
      key:      'cliente_nombre',
      header:   'Cliente',
      accessor: 'cliente_nombre',
      sortable: true,
      cell:     row => <span className="font-medium">{row.cliente_nombre}</span>,
    },
    {
      key:    'modo_cobro',
      header: 'Modo',
      cell:   row => <span className="font-mono text-xs text-gray-500">{row.modo_cobro}</span>,
    },
    {
      key:    'total',
      header: 'Total',
      cell:   row => (
        <span className="tabular-nums font-medium">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key:    'fecha_validez',
      header: 'Válida hasta',
      cell:   row => {
        if (!row.fecha_validez) return '—';
        const vencida = new Date(row.fecha_validez) < new Date();
        return (
          <span className={vencida ? 'text-red-500' : 'text-gray-700'}>
            {formatDate(row.fecha_validez)}
          </span>
        );
      },
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StatusBadge estado={row.estado} />,
    },
    {
      key:    'orden_id',
      header: 'OS',
      cell:   row =>
        row.orden_id ? (
          <Button
            variant="link"
            size="sm"
            onClick={e => { e.stopPropagation(); navigate(`/ordenes/${row.orden_id}`); }}
          >
            Ver OS
          </Button>
        ) : null,
    },
    {
      key:    'actions',
      header: '',
      cell:   row => (
        <Button
          variant="ghost"
          size="icon"
          onClick={e => { e.stopPropagation(); navigate(`/cotizaciones/${row.id}`); }}
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description={`${cotizaciones.length} cotización${cotizaciones.length !== 1 ? 'es' : ''}`}
        breadcrumbs={[{ label: 'Cotizaciones' }]}
        action={
          <Button onClick={() => navigate('/cotizaciones/nueva')}>+ Nueva Cotización</Button>
        }
      />

      <DataTable
        columns={columns}
        data={cotizaciones}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar por número o cliente..."
        emptyMessage="No hay cotizaciones. ¡Crea la primera!"
        onRowClick={row => navigate(`/cotizaciones/${row.id}`)}
      />
    </div>
  );
}
