import { useMemo } from 'react';
import { useOrdenes } from './useOrdenes';
import { useFacturasCartera } from './useFacturas';
import { useCotizaciones } from './useCotizaciones';

// ── helpers ───────────────────────────────────────────────
function monthKey(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, m] = key.split('-');
  const NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${NAMES[parseInt(m) - 1]} ${year.slice(2)}`;
}

function last6MonthKeys() {
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

const ESTADO_COLOR: Record<string, string> = {
  'RECIBIDA':      '#6b7280',
  'EN PROCESO':    '#3b82f6',
  'ENTREGADA':     '#f59e0b',
  'FE REGISTRADA': '#8b5cf6',
  'PAGADA':        '#10b981',
  'ANULADA':       '#ef4444',
};

const ESTADO_ORDER = ['RECIBIDA','EN PROCESO','ENTREGADA','FE REGISTRADA','PAGADA','ANULADA'];

// ── hook ─────────────────────────────────────────────────
export function useDashboard() {
  const { data: ordenes = [],      isLoading: loadO } = useOrdenes();
  const { data: cartera = [],      isLoading: loadF } = useFacturasCartera();
  const { data: cotizaciones = [], isLoading: loadC } = useCotizaciones();

  const stats = useMemo(() => {
    const hoy        = new Date();
    const curKey     = monthKey(hoy.toLocaleDateString('en-CA'));
    const prevDate   = new Date(hoy); prevDate.setMonth(prevDate.getMonth() - 1);
    const prevKey    = monthKey(prevDate.toLocaleDateString('en-CA'));

    const activas    = ordenes.filter(o => o.estado !== 'ANULADA');

    // Current month / prev month
    const curOrdenes  = activas.filter(o => monthKey(o.fecha) === curKey);
    const prevOrdenes = activas.filter(o => monthKey(o.fecha) === prevKey);

    const facturadoCur  = curOrdenes.reduce((s, o) => s + o.valor + o.iva, 0);
    const facturadoPrev = prevOrdenes.reduce((s, o) => s + o.valor + o.iva, 0);

    // Cartera
    const totalCartera = cartera.reduce((s, f) => s + f.total, 0);

    // Work in progress
    const enProceso = activas.filter(o => ['RECIBIDA','EN PROCESO'].includes(o.estado)).length;

    // Monthly chart — last 6 months
    const monthlyData = last6MonthKeys().map(key => {
      const mes = activas.filter(o => monthKey(o.fecha) === key);
      return {
        mes:       monthLabel(key),
        Facturado: mes.reduce((s, o) => s + o.valor + o.iva, 0),
        Cobrado:   mes.filter(o => o.estado === 'PAGADA').reduce((s, o) => s + o.valor + o.iva, 0),
        ordenes:   mes.length,
      };
    });

    // Estado distribution (donut)
    const estadoDist = ESTADO_ORDER
      .map(estado => ({
        name:  estado,
        value: ordenes.filter(o => o.estado === estado).length,
        color: ESTADO_COLOR[estado],
      }))
      .filter(d => d.value > 0);

    // Secondary KPIs
    const cotizacionesActivas = cotizaciones.filter(c =>
      ['BORRADOR', 'ENVIADA'].includes(c.estado)
    ).length;
    const pendientesEntrega = activas.filter(o => o.estado === 'ENTREGADA').length;
    const pendientesCobro   = activas.filter(o => o.estado === 'FE REGISTRADA').length;

    return {
      ordenesEsteMes:     curOrdenes.length,
      ordenesMesAnterior: prevOrdenes.length,
      facturadoCur,
      facturadoPrev,
      totalCartera,
      enProceso,
      monthlyData,
      estadoDist,
      cotizacionesActivas,
      pendientesEntrega,
      pendientesCobro,
      totalOrdenes: ordenes.length,
    };
  }, [ordenes, cartera, cotizaciones]);

  return { ...stats, isLoading: loadO || loadF || loadC };
}
