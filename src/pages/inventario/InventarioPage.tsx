import { useState, useMemo } from 'react';
import { Pencil, ArrowRightLeft, ToggleLeft, ToggleRight, History } from 'lucide-react';
import { useInventario, useUpdateInventarioItem, useMovimientos } from '../../hooks/useInventario';
import type { InventarioItem } from '../../types/supabase.types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog';
import { InventarioItemForm } from './InventarioItemForm';
import { MovimientoModal } from './MovimientoModal';

// ── Stock badge ───────────────────────────────────────────
function StockBadge({ actual, minimo }: { actual: number; minimo: number }) {
  if (actual === 0)         return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Sin stock</span>;
  if (actual < minimo)      return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Stock bajo</span>;
  return                           <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />OK</span>;
}

// ── Historial modal ───────────────────────────────────────
function HistorialModal({ item, onClose }: { item: InventarioItem | null; onClose: () => void }) {
  const { data: movimientos = [], isLoading } = useMovimientos(item?.id);

  const TIPO_COLOR: Record<string, string> = {
    ENTRADA: 'text-green-600 bg-green-50',
    SALIDA:  'text-red-600   bg-red-50',
    AJUSTE:  'text-blue-600  bg-blue-50',
  };

  return (
    <Dialog open={!!item} onClose={onClose} title={`Historial — ${item?.nombre ?? ''}`} className="max-w-2xl">
      {item && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            Stock actual: <strong>{item.stock_actual} {item.unidad}</strong> · Mínimo: {item.stock_minimo} {item.unidad}
          </p>

          {isLoading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Cargando...</p>
          ) : movimientos.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No hay movimientos registrados</p>
          ) : (
            <div className="max-h-96 overflow-y-auto flex flex-col gap-1.5">
              {movimientos.map(mov => (
                <div key={mov.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-sm hover:bg-gray-50">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${TIPO_COLOR[mov.tipo] ?? ''}`}>
                    {mov.tipo}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-medium">
                        {mov.stock_antes} → {mov.stock_despues} {item.unidad}
                      </span>
                      <span className="text-gray-400 text-xs">({mov.tipo === 'ENTRADA' ? '+' : mov.tipo === 'SALIDA' ? '-' : '='}{mov.cantidad})</span>
                    </div>
                    {(mov.referencia || mov.nota) && (
                      <p className="text-xs text-gray-400 truncate">{[mov.referencia, mov.nota].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(mov.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ── InventarioPage ────────────────────────────────────────
export default function InventarioPage() {
  const { data: items = [], isLoading } = useInventario();
  const update = useUpdateInventarioItem();

  const [formOpen,      setFormOpen]      = useState(false);
  const [editItem,      setEditItem]      = useState<InventarioItem | null>(null);
  const [movItem,       setMovItem]       = useState<InventarioItem | null>(null);
  const [historialItem, setHistorialItem] = useState<InventarioItem | null>(null);

  function openCreate() { setEditItem(null); setFormOpen(true); }
  function openEdit(i: InventarioItem) { setEditItem(i); setFormOpen(true); }

  const stats = useMemo(() => ({
    activos:    items.filter(i => i.activo).length,
    stockBajo:  items.filter(i => i.activo && i.stock_actual < i.stock_minimo).length,
    sinStock:   items.filter(i => i.activo && i.stock_actual === 0).length,
    valorTotal: items.reduce((s, i) => s + i.stock_actual * i.precio_unitario, 0),
  }), [items]);

  const columns: Column<InventarioItem>[] = [
    {
      key:      'codigo',
      header:   'Código',
      accessor: 'codigo',
      sortable: true,
      cell:     row => <span className="font-mono text-xs text-gray-500">{row.codigo}</span>,
    },
    {
      key:      'nombre',
      header:   'Ítem',
      accessor: 'nombre',
      sortable: true,
      cell:     row => (
        <div>
          <p className="font-medium text-gray-800">{row.nombre}</p>
          {row.categoria && <p className="text-xs text-gray-400">{row.categoria}</p>}
        </div>
      ),
    },
    {
      key:    'stock',
      header: 'Stock',
      cell:   row => (
        <div className="text-sm">
          <span className="font-semibold tabular-nums">{row.stock_actual}</span>
          <span className="text-gray-400 ml-1">{row.unidad}</span>
          <span className="text-gray-300 mx-1">/</span>
          <span className="text-xs text-gray-400">mín {row.stock_minimo}</span>
        </div>
      ),
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StockBadge actual={row.stock_actual} minimo={row.stock_minimo} />,
    },
    {
      key:    'precio_unitario',
      header: 'Precio unit.',
      cell:   row => <span className="tabular-nums text-sm">{formatCurrency(row.precio_unitario)}</span>,
    },
    {
      key:    'valor',
      header: 'Valor stock',
      cell:   row => (
        <span className="tabular-nums text-sm font-medium">
          {formatCurrency(row.stock_actual * row.precio_unitario)}
        </span>
      ),
    },
    {
      key:    'ubicacion',
      header: 'Ubicación',
      cell:   row => <span className="text-xs text-gray-400">{row.ubicacion ?? '—'}</span>,
    },
    {
      key:    'actions',
      header: '',
      cell:   row => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Registrar movimiento"
            onClick={() => setMovItem(row)}
          >
            <ArrowRightLeft className="h-4 w-4 text-[#e8734a]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Historial"
            onClick={() => setHistorialItem(row)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => openEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={row.activo ? 'Desactivar' : 'Activar'}
            onClick={() => update.mutate({ id: row.id, values: { activo: !row.activo } })}
          >
            {row.activo
              ? <ToggleRight className="h-4 w-4 text-green-600" />
              : <ToggleLeft  className="h-4 w-4 text-gray-400"  />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Control de materiales e insumos"
        breadcrumbs={[{ label: 'Inventario' }]}
        action={<Button onClick={openCreate}>+ Nuevo Ítem</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
        {[
          { label: 'Ítems activos',   value: stats.activos.toString(),         color: 'text-gray-800' },
          { label: 'Stock bajo',      value: stats.stockBajo.toString(),        color: stats.stockBajo > 0  ? 'text-amber-600' : 'text-gray-800' },
          { label: 'Sin stock',       value: stats.sinStock.toString(),         color: stats.sinStock  > 0  ? 'text-red-600'   : 'text-gray-800' },
          { label: 'Valor inventario', value: formatCurrency(stats.valorTotal), color: 'text-gray-800' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar por código, nombre o categoría..."
        emptyMessage="No hay ítems en inventario. ¡Crea el primero!"
        onRowClick={row => setHistorialItem(row)}
      />

      <InventarioItemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editItem}
      />

      <MovimientoModal
        item={movItem}
        onClose={() => setMovItem(null)}
      />

      <HistorialModal
        item={historialItem}
        onClose={() => setHistorialItem(null)}
      />
    </div>
  );
}
