import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Download } from 'lucide-react';
import { useOrdenes } from '../../hooks/useOrdenes';
import { usePermissions } from '../../hooks/useAuth';
import type { OrdenesFilters } from '../../services/ordenes.service';
import type { Orden } from '../../types/supabase.types';
import { ESTADOS_ORDEN } from '../../lib/constants';
import { getEmpresaConfig } from '../../services/config.service';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { downloadCSV } from '../../lib/csv';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';

export default function OrdenesPage() {
  const navigate   = useNavigate();
  const { can }    = usePermissions();
  const { prefijo } = getEmpresaConfig();

  const [filters, setFilters] = useState<OrdenesFilters>({});
  const [search,  setSearch]  = useState('');

  const { data: ordenes = [], isLoading } = useOrdenes(filters);

  const filtered = useMemo(() => {
    if (!search.trim()) return ordenes;
    const q = search.toLowerCase();
    return ordenes.filter(
      o =>
        String(o.no_doc).includes(q) ||
        o.cliente_nombre.toLowerCase().includes(q)
    );
  }, [ordenes, search]);

  const columns: Column<Orden>[] = [
    {
      key:       'no_doc',
      header:    'No. TT',
      accessor:  'no_doc',
      sortable:  true,
      className: 'font-mono font-semibold text-[#e8734a] whitespace-nowrap',
      cell:      row => `${prefijo}${row.no_doc}`,
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
      cell:     row => (
        <span className="font-medium text-gray-800 truncate max-w-[180px] block">
          {row.cliente_nombre}
        </span>
      ),
    },
    {
      key:    'tipo_doc',
      header: 'Tipo',
      cell:   row => (
        <span className={
          row.tipo_doc === 'F.E.'
            ? 'text-purple-600 font-medium'
            : 'text-gray-500'
        }>
          {row.tipo_doc}
        </span>
      ),
    },
    {
      key:    'modo_cobro',
      header: 'Modo',
      cell:   row => (
        <span className="text-xs text-gray-500 font-mono">{row.modo_cobro}</span>
      ),
    },
    {
      key:    'kg_total',
      header: 'KG / Cant.',
      cell:   row => (
        <span className="text-right block tabular-nums">
          {row.modo_cobro === 'KG'
            ? `${row.kg_total} kg`
            : `${row.cant_total} uds`}
        </span>
      ),
    },
    {
      key:    'valor',
      header: 'Valor',
      cell:   row => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {formatCurrency(row.valor + row.iva)}
        </span>
      ),
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StatusBadge estado={row.estado} />,
    },
    {
      key:    'actions',
      header: '',
      cell:   row => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={e => { e.stopPropagation(); navigate(`/ordenes/${row.id}`); }}
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.pdf_url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={e => { e.stopPropagation(); window.open(row.pdf_url!, '_blank'); }}
              title="Ver PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  function exportarCSV() {
    downloadCSV('ordenes', [
      'No. Orden', 'Fecha', 'Hora', 'Cliente', 'Tipo', 'Modo cobro',
      'KG / Cant', 'Subtotal', 'IVA', 'Total', 'Estado', 'No. Factura',
    ], filtered.map(o => [
      `${prefijo}${o.no_doc}`, o.fecha, o.hora?.slice(0, 5) ?? '',
      o.cliente_nombre, o.tipo_doc, o.modo_cobro,
      o.modo_cobro === 'KG' ? `${o.kg_total} kg` : `${o.cant_total} uds`,
      o.valor, o.iva, o.valor + o.iva, o.estado, o.no_factura ?? '',
    ]));
  }

  const toolbar = (
    <>
      <Input
        placeholder="Buscar TT o cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-48"
      />
      <Select
        value={filters.estado ?? ''}
        onChange={e => setFilters(f => ({ ...f, estado: e.target.value || undefined }))}
        className="w-40"
      >
        <option value="">Todos los estados</option>
        {ESTADOS_ORDEN.map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </Select>
      <Select
        value={filters.tipo_doc ?? ''}
        onChange={e => setFilters(f => ({ ...f, tipo_doc: e.target.value || undefined }))}
        className="w-32"
      >
        <option value="">Tipo doc.</option>
        <option value="O.S.">O.S.</option>
        <option value="F.E.">F.E.</option>
      </Select>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={filters.fecha_desde ?? ''}
          onChange={e => setFilters(f => ({ ...f, fecha_desde: e.target.value || undefined }))}
          className="w-36"
          title="Desde"
        />
        <span className="text-gray-400 text-sm">–</span>
        <Input
          type="date"
          value={filters.fecha_hasta ?? ''}
          onChange={e => setFilters(f => ({ ...f, fecha_hasta: e.target.value || undefined }))}
          className="w-36"
          title="Hasta"
        />
      </div>
    </>
  );

  return (
    <div>
      <PageHeader
        title="Órdenes de Servicio"
        description={`${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''} en total`}
        breadcrumbs={[{ label: 'Órdenes' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            {can.crearOrdenes && (
              <Button onClick={() => navigate('/ordenes/nueva')}>+ Nueva Orden</Button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        pageSize={20}
        emptyMessage="No hay órdenes. ¡Crea la primera!"
        onRowClick={row => navigate(`/ordenes/${row.id}`)}
        toolbar={toolbar}
      />
    </div>
  );
}
