import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Cotizacion, CotizacionItem } from '../types/supabase.types';
import { EMPRESA } from '../lib/constants';
import { formatDate, formatCurrency } from '../lib/formatters';
import logo from '../assets/logo.png';

const W = 396.85;
const H = 612.28;

const C = {
  dark:   '#1a1a2e',
  accent: '#e8734a',
  gray:   '#6b7280',
  border: '#e5e7eb',
  light:  '#f9fafb',
};

const s = StyleSheet.create({
  page:      { width: W, height: H, padding: 20, fontSize: 7, fontFamily: 'Helvetica', color: '#111827' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: `1.5 solid ${C.dark}` },
  empresaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo:       { width: 44, height: 44, objectFit: 'contain' },
  empresa:    { gap: 1 },
  empNombre:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },
  empSub:     { fontSize: 6, color: C.gray },
  badge:     { backgroundColor: C.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  badgeType: { fontSize: 6, color: 'white', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  badgeNum:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: 'white' },
  metaRow:   { flexDirection: 'row', gap: 6, marginBottom: 8, backgroundColor: C.light, borderRadius: 3, padding: 6 },
  metaBox:   { flex: 1 },
  metaLabel: { fontSize: 5.5, color: C.gray, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 1 },
  metaVal:   { fontSize: 7, color: C.dark, fontFamily: 'Helvetica-Bold' },
  tableHead: { flexDirection: 'row', backgroundColor: C.dark, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 3, marginBottom: 1 },
  thTxt:     { fontSize: 5.5, color: 'white', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow:  { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2.5, borderBottom: `0.5 solid ${C.border}` },
  tableRowA: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2.5, borderBottom: `0.5 solid ${C.border}`, backgroundColor: C.light },
  tdTxt:     { fontSize: 6.5, color: '#374151' },
  tdNum:     { fontSize: 6.5, color: '#374151', textAlign: 'right' },
  totalsBox: { marginTop: 6, alignItems: 'flex-end' },
  totRow:    { flexDirection: 'row', gap: 8, marginBottom: 2 },
  totLabel:  { fontSize: 6.5, color: C.gray, width: 80, textAlign: 'right' },
  totVal:    { fontSize: 6.5, color: '#111827', width: 70, textAlign: 'right' },
  totalRow:  { flexDirection: 'row', gap: 8, backgroundColor: C.accent, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3, marginTop: 2 },
  totalLbl:  { fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right' },
  totalVal:  { fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold', width: 70, textAlign: 'right' },
  notasBox:  { marginTop: 8, borderTop: `0.5 solid ${C.border}`, paddingTop: 5 },
  notasLbl:  { fontSize: 5.5, color: C.gray, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 },
  notasTxt:  { fontSize: 6.5, color: '#374151' },
  validBox:  { marginTop: 10, padding: 6, borderRadius: 3, border: `0.5 solid ${C.border}`, alignItems: 'center' },
  validTxt:  { fontSize: 6.5, color: C.gray },
  validDate: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.dark },
});

interface CotizacionPDFProps {
  cotizacion: Cotizacion;
  items:      CotizacionItem[];
}

export function CotizacionPDF({ cotizacion, items }: CotizacionPDFProps) {
  return (
    <Document>
      <Page size={[W, H]} style={s.page}>

        {/* ── HEADER ─────────────────────────────── */}
        <View style={s.header}>
          <View style={s.empresaRow}>
            <Image src={logo} style={s.logo} />
            <View style={s.empresa}>
              <Text style={s.empNombre}>{EMPRESA.nombre}</Text>
              <Text style={s.empSub}>{EMPRESA.direccion}</Text>
              <Text style={s.empSub}>Tel: {EMPRESA.tel1}  /  {EMPRESA.tel2}</Text>
              <Text style={s.empSub}>NIT: {EMPRESA.nit}</Text>
            </View>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeType}>COTIZACIÓN</Text>
            <Text style={s.badgeNum}>{cotizacion.numero}</Text>
          </View>
        </View>

        {/* ── META ────────────────────────────────── */}
        <View style={s.metaRow}>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Fecha</Text>
            <Text style={s.metaVal}>{formatDate(cotizacion.fecha)}</Text>
          </View>
          <View style={[s.metaBox, { flex: 2 }]}>
            <Text style={s.metaLabel}>Cliente</Text>
            <Text style={s.metaVal}>{cotizacion.cliente_nombre}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Modo cobro</Text>
            <Text style={s.metaVal}>{cotizacion.modo_cobro}</Text>
          </View>
        </View>

        {/* ── ÍTEMS ───────────────────────────────── */}
        <View style={s.tableHead}>
          <Text style={[s.thTxt, { width: 14 }]}>#</Text>
          <Text style={[s.thTxt, { width: 28 }]}>Cant.</Text>
          <Text style={[s.thTxt, { flex: 1 }]}>Descripción</Text>
          <Text style={[s.thTxt, { width: 55 }]}>Referencia</Text>
          <Text style={[s.thTxt, { width: 44 }]}>Dureza</Text>
          <Text style={[s.thTxt, { width: 42, textAlign: 'right' }]}>V.Unit</Text>
          <Text style={[s.thTxt, { width: 44, textAlign: 'right' }]}>Subtotal</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowA}>
            <Text style={[s.tdTxt, { width: 14 }]}>{item.posicion}</Text>
            <Text style={[s.tdTxt, { width: 28 }]}>{item.cantidad ?? '—'}</Text>
            <Text style={[s.tdTxt, { flex: 1 }]}>{item.descripcion ?? ''}</Text>
            <Text style={[s.tdTxt, { width: 55 }]}>{item.referencia ?? ''}</Text>
            <Text style={[s.tdTxt, { width: 44 }]}>{item.dureza ?? ''}</Text>
            <Text style={[s.tdNum, { width: 42 }]}>{formatCurrency(item.tarifa_unit)}</Text>
            <Text style={[s.tdNum, { width: 44 }]}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}

        {/* ── TOTALES ─────────────────────────────── */}
        <View style={s.totalsBox}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal:</Text>
            <Text style={s.totVal}>{formatCurrency(cotizacion.subtotal)}</Text>
          </View>
          {cotizacion.iva > 0 && (
            <View style={s.totRow}>
              <Text style={s.totLabel}>IVA (19%):</Text>
              <Text style={s.totVal}>{formatCurrency(cotizacion.iva)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>TOTAL COTIZADO:</Text>
            <Text style={s.totalVal}>{formatCurrency(cotizacion.total)}</Text>
          </View>
        </View>

        {/* ── NOTAS ───────────────────────────────── */}
        {cotizacion.notas && (
          <View style={s.notasBox}>
            <Text style={s.notasLbl}>Notas</Text>
            <Text style={s.notasTxt}>{cotizacion.notas}</Text>
          </View>
        )}

        {/* ── VALIDEZ ─────────────────────────────── */}
        {cotizacion.fecha_validez && (
          <View style={s.validBox}>
            <Text style={s.validTxt}>Cotización válida hasta el</Text>
            <Text style={s.validDate}>{formatDate(cotizacion.fecha_validez)}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}
