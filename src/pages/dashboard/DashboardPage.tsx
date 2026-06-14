import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  ClipboardList, Wallet, FileText, Package,
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../lib/formatters';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// ── KPI card con tendencia ────────────────────────────────
interface KpiProps {
  label:    string;
  value:    string;
  prev?:    number;
  cur?:     number;
  suffix?:  string;
  onClick?: () => void;
}

function KpiCard({ label, value, prev, cur, suffix, onClick }: KpiProps) {
  let trend: 'up' | 'down' | 'flat' = 'flat';
  let pct = 0;

  if (prev !== undefined && cur !== undefined && prev > 0) {
    pct = Math.round(((cur - prev) / prev) * 100);
    trend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  }

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:border-[#e8734a] transition-colors' : ''}
      onClick={onClick}
    >
      <CardContent className="pt-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-[#1a1a2e]">{value}</p>
        {prev !== undefined && cur !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up'   && <TrendingUp   className="h-3.5 w-3.5 text-green-500" />}
            {trend === 'down' && <TrendingDown  className="h-3.5 w-3.5 text-red-500"   />}
            {trend === 'flat' && <Minus         className="h-3.5 w-3.5 text-gray-400"  />}
            <span className={`text-xs font-medium ${
              trend === 'up'   ? 'text-green-600' :
              trend === 'down' ? 'text-red-500'   : 'text-gray-400'
            }`}>
              {trend === 'flat' ? 'Sin cambio' : `${Math.abs(pct)}% vs mes anterior`}
            </span>
          </div>
        )}
        {suffix && <p className="text-xs text-gray-400 mt-1">{suffix}</p>}
      </CardContent>
    </Card>
  );
}

// ── Tooltip personalizado para currency ──────────────────
function CurrencyTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?:  string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </span>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tooltip para donut ───────────────────────────────────
function DonutTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <span className="font-semibold">{p.name}:</span>{' '}
      <span className="tabular-nums">{p.value} orden{p.value !== 1 ? 'es' : ''}</span>
    </div>
  );
}

// ── Custom label en el centro del donut ─────────────────
function DonutLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: number }) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" fontSize="22" fontWeight="700" fill="#1a1a2e">{total}</tspan>
      <tspan x={cx} dy="1.4em" fontSize="11" fill="#6b7280">órdenes</tspan>
    </text>
  );
}

// ── Dashboard page ───────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    isLoading,
    ordenesEsteMes, ordenesMesAnterior,
    facturadoCur,   facturadoPrev,
    totalCartera,
    enProceso,
    monthlyData,
    estadoDist,
    cotizacionesActivas,
    pendientesEntrega,
    pendientesCobro,
    totalOrdenes,
  } = useDashboard();

  if (isLoading) return <PageLoader />;

  const nombreUsuario = profile?.full_name?.split(' ')[0] ?? 'bienvenido';
  const horaDelDia    = new Date().getHours();
  const saludo        = horaDelDia < 12 ? 'Buenos días' : horaDelDia < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="flex flex-col gap-6">

      {/* ── Saludo ──────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">
          {saludo}, {nombreUsuario}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Aquí tienes el resumen del negocio al día de hoy.
        </p>
      </div>

      {/* ── KPIs principales ────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Órdenes este mes"
          value={ordenesEsteMes.toString()}
          cur={ordenesEsteMes}
          prev={ordenesMesAnterior}
          onClick={() => navigate('/ordenes')}
        />
        <KpiCard
          label="Facturado este mes"
          value={formatCurrency(facturadoCur)}
          cur={facturadoCur}
          prev={facturadoPrev}
          onClick={() => navigate('/facturacion')}
        />
        <KpiCard
          label="Cartera pendiente"
          value={formatCurrency(totalCartera)}
          suffix={pendientesCobro > 0 ? `${pendientesCobro} factura${pendientesCobro !== 1 ? 's' : ''} sin cobrar` : undefined}
          onClick={() => navigate('/cartera')}
        />
        <KpiCard
          label="En proceso"
          value={enProceso.toString()}
          suffix="RECIBIDA + EN PROCESO"
          onClick={() => navigate('/ordenes')}
        />
      </div>

      {/* ── Gráficas ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Bar chart — Facturado vs Cobrado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Facturado vs Cobrado — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
                    return `$${v}`;
                  }}
                  width={60}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar dataKey="Facturado" fill="#1a1a2e" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Cobrado"   fill="#e8734a" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut — Estado de órdenes */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            {estadoDist.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                No hay órdenes aún
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estadoDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {estadoDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                      <DonutLabel total={totalOrdenes} />
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Leyenda manual */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                  {estadoDist.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto font-semibold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── KPIs secundarios ────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          className="cursor-pointer hover:border-[#e8734a] transition-colors"
          onClick={() => navigate('/cotizaciones')}
        >
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{cotizacionesActivas}</p>
              <p className="text-xs text-gray-500">Cotizaciones activas</p>
              <p className="text-xs text-gray-400">BORRADOR + ENVIADA</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-[#e8734a] transition-colors"
          onClick={() => navigate('/ordenes')}
        >
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{pendientesEntrega}</p>
              <p className="text-xs text-gray-500">Pendientes de entrega</p>
              <p className="text-xs text-gray-400">Estado ENTREGADA sin FE</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-[#e8734a] transition-colors"
          onClick={() => navigate('/cartera')}
        >
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{pendientesCobro}</p>
              <p className="text-xs text-gray-500">Pendientes de cobro</p>
              <p className="text-xs text-gray-400">FE emitida, sin pago</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Acceso rápido ───────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Acciones rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/ordenes/nueva')}>
              <ClipboardList className="h-4 w-4 mr-1.5" /> Nueva OS
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/cotizaciones/nueva')}>
              <FileText className="h-4 w-4 mr-1.5" /> Nueva Cotización
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/facturacion')}>
              <Wallet className="h-4 w-4 mr-1.5" /> Registrar FE
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/cartera')}>
              <Wallet className="h-4 w-4 mr-1.5" /> Ver Cartera
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
