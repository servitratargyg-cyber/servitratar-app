import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Wallet, Users, Package, Download } from 'lucide-react';
import {
  useReporteVentas,
  useReporteCartera,
  useReporteNomina,
  useReporteInventario,
} from '../../hooks/useReportes';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { downloadCSV } from '../../lib/csv';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const PIE_COLORS = ['#1a1a2e', '#e8734a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

// ── Tooltip helpers ───────────────────────────────────────
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}


function KpiMini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold tabular-nums text-[#1a1a2e]">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Tabs ──────────────────────────────────────────────────
const TABS = [
  { id: 'ventas',     label: 'Ventas',     icon: TrendingUp },
  { id: 'cartera',    label: 'Cartera',    icon: Wallet     },
  { id: 'nomina',     label: 'Nómina',     icon: Users      },
  { id: 'inventario', label: 'Inventario', icon: Package    },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Reporte Ventas ────────────────────────────────────────
function ReporteVentas() {
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const { mensual, topClientes, totalFacturado, totalCobrado, ticketPromedio, totalOrdenes, activas, isLoading } = useReporteVentas(anio);

  function exportarOrdenes() {
    downloadCSV(`ventas_${anio}`, [
      'No. Orden', 'Fecha', 'Cliente', 'Tipo', 'Modo Cobro', 'Subtotal', 'IVA', 'Total', 'Estado',
    ], (activas ?? []).map(o => [
      o.no_doc, o.fecha, o.cliente_nombre, o.tipo_doc, o.modo_cobro,
      o.valor, o.iva, o.valor + o.iva, o.estado,
    ]));
  }

  function exportarMensual() {
    downloadCSV(`ventas_mensual_${anio}`, ['Mes', 'Facturado', 'Cobrado', 'Órdenes'],
      mensual.map(m => [m.mes, m.Facturado, m.Cobrado, m.ordenes])
    );
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Select value={anio} onChange={e => setAnio(Number(e.target.value))} className="w-28">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportarMensual}>
          <Download className="h-3.5 w-3.5 mr-1" /> Mensual CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportarOrdenes}>
          <Download className="h-3.5 w-3.5 mr-1" /> Detalle CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiMini label="Total órdenes"   value={totalOrdenes.toString()} />
        <KpiMini label="Total facturado" value={formatCurrency(totalFacturado)} />
        <KpiMini label="Total cobrado"   value={formatCurrency(totalCobrado)} sub={`${totalFacturado > 0 ? Math.round(totalCobrado / totalFacturado * 100) : 0}% cobrado`} />
        <KpiMini label="Ticket promedio" value={formatCurrency(ticketPromedio)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Facturado vs Cobrado por mes — {anio}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mensual} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={64}
                tickFormatter={v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`}
              />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} iconType="square" iconSize={10} />
              <Bar dataKey="Facturado" fill="#1a1a2e" radius={[3,3,0,0]} maxBarSize={28} />
              <Bar dataKey="Cobrado"   fill="#e8734a" radius={[3,3,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top clientes por valor facturado — {anio}</CardTitle></CardHeader>
        <CardContent>
          {topClientes.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos para este año</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="pb-2 text-left font-medium">#</th>
                    <th className="pb-2 text-left font-medium">Cliente</th>
                    <th className="pb-2 text-right font-medium">Órdenes</th>
                    <th className="pb-2 text-right font-medium">Valor total</th>
                    <th className="pb-2 text-right font-medium">% del total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topClientes.map((c, i) => (
                    <tr key={c.nombre} className="hover:bg-gray-50">
                      <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 font-medium">{c.nombre}</td>
                      <td className="py-2.5 text-right tabular-nums">{c.ordenes}</td>
                      <td className="py-2.5 text-right tabular-nums font-semibold">{formatCurrency(c.valor)}</td>
                      <td className="py-2.5 text-right tabular-nums text-gray-500">
                        {totalFacturado > 0 ? `${((c.valor / totalFacturado) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Reporte Cartera ───────────────────────────────────────
function ReporteCartera() {
  const { buckets, porCliente, conDias, totalCartera, enRiesgo, isLoading } = useReporteCartera();

  function exportarCartera() {
    downloadCSV('cartera_pendiente', [
      'No. Factura', 'Fecha', 'Cliente', 'Total', 'Días vencida',
    ], (conDias ?? []).map(f => [
      f.numero, f.fecha, f.cliente_nombre, f.total, f.dias,
    ]));
  }

  function exportarEstadoCuenta() {
    downloadCSV('estado_cuenta_clientes', ['Cliente', 'Facturas', 'Días máx', 'Total pendiente'],
      (porCliente ?? []).map(c => [c.nombre, c.facturas, c.diasMax, c.valor])
    );
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportarEstadoCuenta}>
          <Download className="h-3.5 w-3.5 mr-1" /> Estado cuenta CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportarCartera}>
          <Download className="h-3.5 w-3.5 mr-1" /> Cartera detalle CSV
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiMini label="Total en cartera" value={formatCurrency(totalCartera)} />
        <KpiMini label="En riesgo (> 60d)" value={formatCurrency(enRiesgo)} sub={totalCartera > 0 ? `${Math.round(enRiesgo / totalCartera * 100)}% del total` : ''} />
        <KpiMini label="Clientes con deuda" value={porCliente.length.toString()} />
        <KpiMini label="0–30 días (sano)" value={formatCurrency(buckets[0]?.valor ?? 0)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Distribución por antigüedad</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={buckets} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`}
                />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="valor" name="Valor" radius={[0,3,3,0]} maxBarSize={32}>
                  {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen por bucket</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {buckets.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <span className="flex-1 text-sm text-gray-700">{b.label}</span>
                  <span className="text-sm font-medium tabular-nums">{b.cantidad} factura{b.cantidad !== 1 ? 's' : ''}</span>
                  <span className="text-sm font-bold tabular-nums text-right w-32">{formatCurrency(b.valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cartera por cliente</CardTitle></CardHeader>
        <CardContent>
          {porCliente.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin facturas pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="pb-2 text-left font-medium">Cliente</th>
                    <th className="pb-2 text-right font-medium">Facturas</th>
                    <th className="pb-2 text-right font-medium">Mayor antigüedad</th>
                    <th className="pb-2 text-right font-medium">Total pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porCliente.map(c => (
                    <tr key={c.nombre} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium">{c.nombre}</td>
                      <td className="py-2.5 text-right">{c.facturas}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-medium ${c.diasMax > 60 ? 'text-red-600' : c.diasMax > 30 ? 'text-amber-600' : 'text-green-600'}`}>
                          {c.diasMax} días
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-bold">{formatCurrency(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Reporte Nómina ────────────────────────────────────────
function ReporteNomina() {
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const { mensual, porEmpleado, totalDevengado, totalNeto, totalCosto, nominas, isLoading } = useReporteNomina(anio);

  function exportarNominas() {
    downloadCSV(`nomina_${anio}`, [
      'Empleado ID', 'Mes', 'Año', 'Días', 'Salario base', 'Aux transporte',
      'Total devengado', 'Salud emp.', 'Pensión emp.', 'Total deducciones', 'Neto a pagar', 'Estado',
    ], (nominas ?? []).map(n => [
      n.empleado_id, n.periodo_mes, n.periodo_anio, n.dias_trabajados,
      n.salario_base, n.aux_transporte, n.total_devengado,
      n.salud_empleado, n.pension_empleado, n.total_deducciones, n.neto_pagar, n.estado,
    ]));
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Select value={anio} onChange={e => setAnio(Number(e.target.value))} className="w-28">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportarNominas}>
          <Download className="h-3.5 w-3.5 mr-1" /> Nóminas CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiMini label="Total devengado" value={formatCurrency(totalDevengado)} />
        <KpiMini label="Total neto pagado" value={formatCurrency(totalNeto)} sub={`Deducciones: ${formatCurrency(totalDevengado - totalNeto)}`} />
        <KpiMini label="Costo empresa adicional" value={formatCurrency(totalCosto)} sub="Aportes + prestaciones" />
      </div>

      <Card>
        <CardHeader><CardTitle>Neto pagado por mes — {anio}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mensual} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={64}
                tickFormatter={v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`}
              />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} iconType="square" iconSize={10} />
              <Bar dataKey="Devengado" fill="#1a1a2e" radius={[3,3,0,0]} maxBarSize={28} />
              <Bar dataKey="Neto"      fill="#e8734a" radius={[3,3,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resumen por empleado — {anio}</CardTitle></CardHeader>
        <CardContent>
          {porEmpleado.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin nóminas liquidadas para {anio}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                    <th className="pb-2 text-left font-medium">Empleado</th>
                    <th className="pb-2 text-right font-medium">Meses</th>
                    <th className="pb-2 text-right font-medium">Devengado</th>
                    <th className="pb-2 text-right font-medium">Neto pagado</th>
                    <th className="pb-2 text-right font-medium">Costo empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porEmpleado.map(e => (
                    <tr key={e.nombre} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium">{e.nombre || '—'}</td>
                      <td className="py-2.5 text-right">{e.meses}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(e.devengado)}</td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-[#e8734a]">{formatCurrency(e.neto)}</td>
                      <td className="py-2.5 text-right tabular-nums text-gray-500">{formatCurrency(e.costoEmpresa)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="pt-2.5">Total</td>
                    <td />
                    <td className="pt-2.5 text-right tabular-nums">{formatCurrency(totalDevengado)}</td>
                    <td className="pt-2.5 text-right tabular-nums text-[#e8734a]">{formatCurrency(totalNeto)}</td>
                    <td className="pt-2.5 text-right tabular-nums text-gray-500">{formatCurrency(totalCosto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Reporte Inventario ────────────────────────────────────
function ReporteInventario() {
  const { activos, stockBajo, sinStock, valorTotal, porCategoria, criticos, items, isLoading } = useReporteInventario();

  function exportarInventario() {
    downloadCSV('inventario', [
      'Código', 'Nombre', 'Categoría', 'Unidad', 'Stock actual', 'Stock mínimo',
      'Precio unit.', 'Valor total', 'Proveedor', 'Activo',
    ], (items ?? []).map(i => [
      i.codigo, i.nombre, i.categoria ?? '', i.unidad,
      i.stock_actual, i.stock_minimo, i.precio_unitario,
      i.stock_actual * i.precio_unitario, i.proveedor ?? '', i.activo ? 'Sí' : 'No',
    ]));
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportarInventario}>
          <Download className="h-3.5 w-3.5 mr-1" /> Inventario CSV
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiMini label="Ítems activos"    value={activos.length.toString()} />
        <KpiMini label="Stock bajo"       value={stockBajo.length.toString()} sub={stockBajo.length > 0 ? 'Requieren reposición' : 'Todo en orden'} />
        <KpiMini label="Sin stock"        value={sinStock.length.toString()} sub={sinStock.length > 0 ? 'Crítico' : ''} />
        <KpiMini label="Valor inventario" value={formatCurrency(valorTotal)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Valor por categoría</CardTitle></CardHeader>
          <CardContent>
            {porCategoria.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Sin ítems registrados</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={porCategoria} dataKey="valor" nameKey="categoria" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                      {porCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5">
                  {porCategoria.map((c, i) => (
                    <div key={c.categoria} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 text-gray-700">{c.categoria}</span>
                      <span className="text-gray-400 text-xs">{c.items} ítem{c.items !== 1 ? 's' : ''}</span>
                      <span className="tabular-nums font-medium text-right w-28">{formatCurrency(c.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ítems críticos (stock bajo o sin stock)</CardTitle></CardHeader>
          <CardContent>
            {criticos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-green-600 gap-2">
                <p className="font-semibold">¡Inventario saludable!</p>
                <p className="text-sm text-gray-400">Todos los ítems tienen stock suficiente</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {criticos.map(item => {
                  const pct = item.stock_minimo > 0 ? Math.round(item.stock_actual / item.stock_minimo * 100) : 0;
                  const isSinStock = item.stock_actual === 0;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${isSinStock ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono">{item.codigo} · {item.categoria ?? '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold tabular-nums ${isSinStock ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.stock_actual} / {item.stock_minimo} {item.unidad}
                        </p>
                        <p className="text-xs text-gray-400">{isSinStock ? 'Sin stock' : `${pct}% del mínimo`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── ReportesPage ──────────────────────────────────────────
export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('ventas');

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Análisis e informes del negocio"
        breadcrumbs={[{ label: 'Reportes' }]}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-[#e8734a] text-[#e8734a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'ventas'     && <ReporteVentas />}
      {activeTab === 'cartera'    && <ReporteCartera />}
      {activeTab === 'nomina'     && <ReporteNomina />}
      {activeTab === 'inventario' && <ReporteInventario />}
    </div>
  );
}
