import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Ban, Download, FileText } from 'lucide-react';
import { useFacturas, useAnularFactura } from '../../hooks/useFacturas';
import type { Factura } from '../../types/supabase.types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { downloadCSV } from '../../lib/csv';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Button } from '../../components/ui/button';
import { RegistrarFEModal } from './RegistrarFEModal';

export default function FacturacionPage() {
  const navigate  = useNavigate();
  const { data: facturas = [], isLoading } = useFacturas();
  const anular    = useAnularFactura();

  const [feOpen,         setFeOpen]         = useState(false);
  const [anularFactura,  setAnularFactura]   = useState<Factura | null>(null);

  const columns: Column<Factura>[] = [
    {
      key:      'numero',
      header:   'Nro. Factura',
      accessor: 'numero',
      sortable: true,
      cell:     row => <span className="font-mono font-semibold text-[#1a1a2e]">{row.numero}</span>,
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
      key:    'remision',
      header: 'Remisión (TT)',
      cell:   row => (
        <button
          className="font-mono text-[#e8734a] hover:underline text-sm"
          onClick={e => {
            e.stopPropagation();
            // Navigate to orden by searching remision
            navigate(`/ordenes?search=${row.remision ?? ''}`);
          }}
        >
          {row.remision ?? '—'}
        </button>
      ),
    },
    {
      key:    'base',
      header: 'Base',
      cell:   row => <span className="tabular-nums">{formatCurrency(row.base)}</span>,
    },
    {
      key:    'rete',
      header: 'Retenciones',
      cell:   row => {
        const total = row.rete_fuente + row.rete_ica;
        return total > 0
          ? <span className="tabular-nums text-red-600">− {formatCurrency(total)}</span>
          : <span className="text-gray-400 text-xs">N/A</span>;
      },
    },
    {
      key:    'total',
      header: 'Total a cobrar',
      cell:   row => <span className="tabular-nums font-semibold">{formatCurrency(row.total)}</span>,
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StatusBadge estado={row.estado} />,
    },
    {
      key:    'fecha_pago',
      header: 'Fecha pago',
      cell:   row => row.fecha_pago ? formatDate(row.fecha_pago) : '—',
    },
    {
      key:    'pdf',
      header: 'PDF',
      cell:   row => row.pdf_url ? (
        <a
          href={row.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Ver PDF de la factura"
          className="inline-flex items-center justify-center rounded-md p-1 text-[#e8734a] hover:bg-orange-50"
        >
          <FileText className="h-4 w-4" />
        </a>
      ) : (
        <span className="text-gray-300 text-xs pl-1">—</span>
      ),
    },
    {
      key:    'actions',
      header: '',
      cell:   row => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {row.estado === 'PDTE PAGO' && (
            <Button
              variant="ghost"
              size="icon"
              title="Anular factura"
              onClick={() => setAnularFactura(row)}
            >
              <Ban className="h-4 w-4 text-red-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Ver en cartera"
            onClick={() => navigate('/cartera')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function exportarCSV() {
    downloadCSV('facturas', [
      'No. Factura', 'Fecha', 'Cliente', 'Remisión', 'Base',
      'IVA', 'Rete Fuente', 'Rete ICA', 'Total', 'Estado', 'Fecha pago',
    ], facturas.map(f => [
      f.numero, f.fecha, f.cliente_nombre, f.remision ?? '',
      f.base, f.iva, f.rete_fuente, f.rete_ica, f.total,
      f.estado, f.fecha_pago ?? '',
    ]));
  }

  const pdtePago    = facturas.filter(f => f.estado === 'PDTE PAGO').length;
  const totalCartera = facturas
    .filter(f => f.estado === 'PDTE PAGO')
    .reduce((s, f) => s + f.total, 0);

  return (
    <div>
      <PageHeader
        title="Facturación"
        description={`${facturas.length} factura${facturas.length !== 1 ? 's' : ''} · ${pdtePago} pendiente${pdtePago !== 1 ? 's' : ''} · ${formatCurrency(totalCartera)} en cartera`}
        breadcrumbs={[{ label: 'Facturación' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button onClick={() => setFeOpen(true)}>+ Registrar FE</Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={facturas}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar por número, cliente o remisión..."
        emptyMessage="No hay facturas registradas."
      />

      <RegistrarFEModal open={feOpen} onClose={() => setFeOpen(false)} />

      <ConfirmDialog
        open={!!anularFactura}
        title="¿Anular factura?"
        description={`La factura ${anularFactura?.numero} se marcará como ANULADA y las órdenes vinculadas volverán a estado RECIBIDA.`}
        confirmLabel="Anular"
        variant="destructive"
        onConfirm={() => {
          if (anularFactura) anular.mutate(anularFactura);
          setAnularFactura(null);
        }}
        onClose={() => setAnularFactura(null)}
      />
    </div>
  );
}
