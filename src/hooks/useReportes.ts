import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrdenes } from './useOrdenes';
import { useFacturas } from './useFacturas';
import { useNominas } from './useNomina';
import { useInventario } from './useInventario';
import { getMesNombre } from '../lib/formatters';
import { getOrdenItemsConCategoria } from '../services/ordenes.service';

// ── Ventas ────────────────────────────────────────────────
export function useReporteVentas(anio: number, mes: number = 0) {
  const { data: ordenes = [], isLoading } = useOrdenes();

  const data = useMemo(() => {
    const activasAnio = ordenes.filter(o =>
      o.estado !== 'ANULADA' &&
      new Date(o.fecha).getFullYear() === anio
    );

    // Apply month filter for KPIs and top clients
    const activas = mes > 0
      ? activasAnio.filter(o => new Date(o.fecha).getMonth() + 1 === mes)
      : activasAnio;

    // Comparison: same period, previous year
    const activasAnterior = ordenes.filter(o => {
      if (o.estado === 'ANULADA') return false;
      const d = new Date(o.fecha);
      if (d.getFullYear() !== anio - 1) return false;
      if (mes > 0 && d.getMonth() + 1 !== mes) return false;
      return true;
    });
    const totalFacturadoAnterior = activasAnterior.reduce((s, o) => s + o.valor + o.iva, 0);

    // Monthly chart always shows the full year for context
    const mensual = Array.from({ length: 12 }, (_, i) => {
      const m = activasAnio.filter(o => new Date(o.fecha).getMonth() === i);
      return {
        mes:       getMesNombre(i + 1).slice(0, 3),
        Facturado: m.reduce((s, o) => s + o.valor + o.iva, 0),
        Cobrado:   m.filter(o => o.estado === 'PAGADA').reduce((s, o) => s + o.valor + o.iva, 0),
        ordenes:   m.length,
        highlight: mes === 0 || mes === i + 1,
      };
    });

    // Top clientes filtered by period
    const byCliente: Record<string, { nombre: string; valor: number; ordenes: number }> = {};
    activas.forEach(o => {
      if (!byCliente[o.cliente_nombre]) {
        byCliente[o.cliente_nombre] = { nombre: o.cliente_nombre, valor: 0, ordenes: 0 };
      }
      byCliente[o.cliente_nombre].valor   += o.valor + o.iva;
      byCliente[o.cliente_nombre].ordenes += 1;
    });
    const topClientes = Object.values(byCliente)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const totalFacturado = activas.reduce((s, o) => s + o.valor + o.iva, 0);
    const totalCobrado   = activas.filter(o => o.estado === 'PAGADA').reduce((s, o) => s + o.valor + o.iva, 0);
    const ticketPromedio = activas.length > 0 ? totalFacturado / activas.length : 0;
    const crecimiento    = totalFacturadoAnterior > 0
      ? ((totalFacturado - totalFacturadoAnterior) / totalFacturadoAnterior) * 100
      : null;

    return {
      mensual, topClientes, totalFacturado, totalCobrado, ticketPromedio,
      totalOrdenes: activas.length, activas, totalFacturadoAnterior, crecimiento,
    };
  }, [ordenes, anio, mes]);

  return { ...data, isLoading };
}

// ── Categorías de ventas ─────────────────────────────────
export function useCategoriasVentas(anio: number, mes: number = 0) {
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['orden_items_categoria'],
    queryFn:  () => getOrdenItemsConCategoria().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const porCategoria = useMemo(() => {
    const filtrado = rawItems.filter((item: any) => {
      const orden = item.ordenes;
      if (!orden || orden.estado === 'ANULADA') return false;
      const d = new Date(orden.fecha);
      if (d.getFullYear() !== anio) return false;
      if (mes > 0 && d.getMonth() + 1 !== mes) return false;
      return true;
    });

    const byCat: Record<string, { categoria: string; cantidad: number; valor: number }> = {};
    filtrado.forEach((item: any) => {
      const cat = item.categoria as string;
      if (!byCat[cat]) byCat[cat] = { categoria: cat, cantidad: 0, valor: 0 };
      byCat[cat].cantidad += item.cantidad ?? 1;
      byCat[cat].valor    += item.subtotal;
    });

    return Object.values(byCat).sort((a, b) => b.valor - a.valor);
  }, [rawItems, anio, mes]);

  return { porCategoria, isLoading };
}

// ── Cartera ───────────────────────────────────────────────
export function useReporteCartera() {
  const { data: facturas = [], isLoading } = useFacturas();

  const data = useMemo(() => {
    const pendientes = facturas.filter(f => f.estado === 'PDTE PAGO');

    const hoy = Date.now();
    function dias(fecha: string) {
      return Math.floor((hoy - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
    }

    const conDias = pendientes.map(f => ({ ...f, dias: dias(f.fecha) }));

    const buckets = [
      { label: '0–30 días',  min: 0,  max: 30,       color: '#10b981' },
      { label: '31–60 días', min: 31, max: 60,        color: '#f59e0b' },
      { label: '61–90 días', min: 61, max: 90,        color: '#f97316' },
      { label: '> 90 días',  min: 91, max: Infinity,  color: '#ef4444' },
    ].map(b => {
      const items = conDias.filter(f => f.dias >= b.min && f.dias <= b.max);
      return { ...b, cantidad: items.length, valor: items.reduce((s, f) => s + f.total, 0) };
    });

    const byCliente: Record<string, { nombre: string; valor: number; facturas: number; diasMax: number }> = {};
    conDias.forEach(f => {
      if (!byCliente[f.cliente_nombre]) {
        byCliente[f.cliente_nombre] = { nombre: f.cliente_nombre, valor: 0, facturas: 0, diasMax: 0 };
      }
      byCliente[f.cliente_nombre].valor    += f.total;
      byCliente[f.cliente_nombre].facturas += 1;
      byCliente[f.cliente_nombre].diasMax   = Math.max(byCliente[f.cliente_nombre].diasMax, f.dias);
    });

    const porCliente  = Object.values(byCliente).sort((a, b) => b.valor - a.valor);
    const totalCartera = pendientes.reduce((s, f) => s + f.total, 0);
    const enRiesgo     = conDias.filter(f => f.dias > 60).reduce((s, f) => s + f.total, 0);

    return { buckets, porCliente, conDias, pendientes, totalCartera, enRiesgo };
  }, [facturas]);

  return { ...data, isLoading };
}

// ── Nómina ────────────────────────────────────────────────
export function useReporteNomina(anio: number) {
  const { data: nominas = [], isLoading } = useNominas(undefined, anio);

  const data = useMemo(() => {
    const mensual = Array.from({ length: 12 }, (_, i) => {
      const mes = nominas.filter(n => n.periodo_mes === i + 1);
      return {
        mes:       getMesNombre(i + 1).slice(0, 3),
        Devengado: mes.reduce((s, n) => s + n.total_devengado, 0),
        Neto:      mes.reduce((s, n) => s + n.neto_pagar, 0),
        empleados: mes.length,
      };
    });

    const byEmp: Record<string, {
      nombre: string; devengado: number; neto: number; costoEmpresa: number; meses: number;
    }> = {};

    nominas.forEach(n => {
      const key = n.empleado_id;
      if (!byEmp[key]) {
        byEmp[key] = {
          nombre:       `${(n as any).empleado?.nombre ?? ''} ${(n as any).empleado?.apellido ?? ''}`.trim(),
          devengado:    0, neto: 0, costoEmpresa: 0, meses: 0,
        };
      }
      byEmp[key].devengado    += n.total_devengado;
      byEmp[key].neto         += n.neto_pagar;
      byEmp[key].costoEmpresa += n.salud_empleador + n.pension_empleador + n.arl + n.caja + n.sena + n.icbf + n.cesantias + n.intereses_ces + n.prima + n.vacaciones;
      byEmp[key].meses        += 1;
    });

    const porEmpleado    = Object.values(byEmp).sort((a, b) => b.devengado - a.devengado);
    const totalDevengado = nominas.reduce((s, n) => s + n.total_devengado, 0);
    const totalNeto      = nominas.reduce((s, n) => s + n.neto_pagar, 0);
    const totalCosto     = porEmpleado.reduce((s, e) => s + e.costoEmpresa, 0);

    return { mensual, porEmpleado, totalDevengado, totalNeto, totalCosto, nominas };
  }, [nominas, anio]);

  return { ...data, isLoading };
}

// ── Inventario ────────────────────────────────────────────
export function useReporteInventario() {
  const { data: items = [], isLoading } = useInventario();

  const data = useMemo(() => {
    const activos    = items.filter(i => i.activo);
    const stockBajo  = activos.filter(i => i.stock_actual > 0 && i.stock_actual < i.stock_minimo);
    const sinStock   = activos.filter(i => i.stock_actual === 0);
    const valorTotal = activos.reduce((s, i) => s + i.stock_actual * i.precio_unitario, 0);

    const byCat: Record<string, { categoria: string; valor: number; items: number }> = {};
    activos.forEach(i => {
      const cat = i.categoria ?? 'Sin categoría';
      if (!byCat[cat]) byCat[cat] = { categoria: cat, valor: 0, items: 0 };
      byCat[cat].valor += i.stock_actual * i.precio_unitario;
      byCat[cat].items += 1;
    });
    const porCategoria = Object.values(byCat).sort((a, b) => b.valor - a.valor);

    const criticos = [...stockBajo, ...sinStock].sort((a, b) => {
      const pctA = a.stock_minimo > 0 ? a.stock_actual / a.stock_minimo : 0;
      const pctB = b.stock_minimo > 0 ? b.stock_actual / b.stock_minimo : 0;
      return pctA - pctB;
    });

    return { activos, stockBajo, sinStock, valorTotal, porCategoria, criticos, items };
  }, [items]);

  return { ...data, isLoading };
}
