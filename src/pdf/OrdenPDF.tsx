import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Orden, OrdenItem } from '../types/supabase.types';
import { getEmpresaConfig } from '../services/config.service';
import { formatDate, formatCurrency } from '../lib/formatters';
import logo from '../assets/logo.png';

// Media carta: 140mm × 216mm → points (1 pt ≈ 0.353mm)
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
  // header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: `1.5 solid ${C.dark}` },
  empresaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo:        { width: 44, height: 44, objectFit: 'contain' },
  empresa:     { gap: 1 },
  empNombre:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },
  empSub:      { fontSize: 6, color: C.gray },
  badge:     { backgroundColor: C.dark, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  badgeType: { fontSize: 6, color: C.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  badgeNum:  { fontSize: 14, fontFamily: 'Helvetica-Bold', color: 'white' },
  // meta row
  metaRow:   { flexDirection: 'row', gap: 6, marginBottom: 8, backgroundColor: C.light, borderRadius: 3, padding: 6 },
  metaBox:   { flex: 1 },
  metaLabel: { fontSize: 5.5, color: C.gray, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 1 },
  metaVal:   { fontSize: 7, color: C.dark, fontFamily: 'Helvetica-Bold' },
  metaValSm: { fontSize: 6.5, color: '#374151' },
  // table
  tableHead: { flexDirection: 'row', backgroundColor: C.dark, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 3, marginBottom: 1 },
  thTxt:     { fontSize: 5.5, color: 'white', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow:  { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2.5, borderBottom: `0.5 solid ${C.border}` },
  tableRowA: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 2.5, borderBottom: `0.5 solid ${C.border}`, backgroundColor: C.light },
  tdTxt:     { fontSize: 6.5, color: '#374151' },
  tdNum:     { fontSize: 6.5, color: '#374151', textAlign: 'right' },
  // totals
  totalsBox: { marginTop: 6, alignItems: 'flex-end' },
  totRow:    { flexDirection: 'row', gap: 8, marginBottom: 2 },
  totLabel:  { fontSize: 6.5, color: C.gray, width: 80, textAlign: 'right' },
  totVal:    { fontSize: 6.5, color: '#111827', width: 70, textAlign: 'right' },
  totalRow:  { flexDirection: 'row', gap: 8, backgroundColor: C.accent, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3, marginTop: 2 },
  totalLbl:  { fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right' },
  totalVal:  { fontSize: 7, color: 'white', fontFamily: 'Helvetica-Bold', width: 70, textAlign: 'right' },
  // obs + firma
  obsBox:    { marginTop: 8, borderTop: `0.5 solid ${C.border}`, paddingTop: 5 },
  obsLabel:  { fontSize: 5.5, color: C.gray, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 },
  obsTxt:    { fontSize: 6.5, color: '#374151' },
  firmas:    { flexDirection: 'row', gap: 12, marginTop: 16 },
  firmaBox:  { flex: 1, borderTop: `0.75 solid ${C.dark}`, paddingTop: 4, alignItems: 'center' },
  firmaTxt:  { fontSize: 5.5, color: C.gray },
});

// Column widths for KG mode
const KG_COLS  = { pos: 14, cant: 28, desc: 110, ref: 60, dur: 50 };
// Column widths for UNIDAD mode
const UN_COLS  = { pos: 14, cant: 24, desc: 90, ref: 48, dur: 44, tarifa: 38, sub: 44 };

interface OrdenPDFProps {
  orden: Orden;
  items: OrdenItem[];
}

export function OrdenPDF({ orden, items }: OrdenPDFProps) {
  const empresa  = getEmpresaConfig();
  const esUnidad = orden.modo_cobro === 'UNIDAD';
  const esFE     = orden.tipo_doc === 'F.E.';
  const cols     = esUnidad ? UN_COLS : KG_COLS;
  const total    = orden.valor + orden.iva;
  const esCot    = false;

  return (
    <Document>
      <Page size={[W, H]} style={s.page}>

        {/* ── HEADER ────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.empresaRow}>
            <Image src={logo} style={s.logo} />
            <View style={s.empresa}>
              <Text style={s.empNombre}>{empresa.nombre}</Text>
              <Text style={s.empSub}>{empresa.direccion}</Text>
              <Text style={s.empSub}>Tel: {empresa.tel1}  /  {empresa.tel2}</Text>
              <Text style={s.empSub}>NIT: {empresa.nit}</Text>
            </View>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeType}>{esCot ? 'COTIZACIÓN' : orden.tipo_doc}</Text>
            <Text style={s.badgeNum}>{empresa.prefijo}{orden.no_doc}</Text>
          </View>
        </View>

        {/* ── META ──────────────────────────────────── */}
        <View style={s.metaRow}>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Fecha</Text>
            <Text style={s.metaVal}>{formatDate(orden.fecha)}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Hora</Text>
            <Text style={s.metaVal}>{orden.hora?.slice(0, 5) ?? '—'}</Text>
          </View>
          <View style={[s.metaBox, { flex: 2 }]}>
            <Text style={s.metaLabel}>Cliente</Text>
            <Text style={s.metaVal}>{orden.cliente_nombre}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Modo cobro</Text>
            <Text style={s.metaVal}>{orden.modo_cobro}</Text>
          </View>
        </View>

        {/* ── ITEMS TABLE ───────────────────────────── */}
        <View style={s.tableHead}>
          <Text style={[s.thTxt, { width: cols.pos }]}>#</Text>
          <Text style={[s.thTxt, { width: cols.cant }]}>Cant.</Text>
          <Text style={[s.thTxt, { flex: 1 }]}>Descripción</Text>
          <Text style={[s.thTxt, { width: cols.ref }]}>Referencia</Text>
          <Text style={[s.thTxt, { width: cols.dur }]}>Dureza</Text>
          {esUnidad && (
            <>
              <Text style={[s.thTxt, { width: UN_COLS.tarifa, textAlign: 'right' }]}>V.Unit</Text>
              <Text style={[s.thTxt, { width: UN_COLS.sub, textAlign: 'right' }]}>Subtotal</Text>
            </>
          )}
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? s.tableRow : s.tableRowA}>
            <Text style={[s.tdTxt, { width: cols.pos }]}>{item.posicion}</Text>
            <Text style={[s.tdTxt, { width: cols.cant }]}>{item.cantidad ?? '—'}</Text>
            <Text style={[s.tdTxt, { flex: 1 }]}>{item.descripcion ?? ''}</Text>
            <Text style={[s.tdTxt, { width: cols.ref }]}>{item.referencia ?? ''}</Text>
            <Text style={[s.tdTxt, { width: cols.dur }]}>{item.dureza ?? ''}</Text>
            {esUnidad && (
              <>
                <Text style={[s.tdNum, { width: UN_COLS.tarifa }]}>
                  {formatCurrency(item.tarifa_unit)}
                </Text>
                <Text style={[s.tdNum, { width: UN_COLS.sub }]}>
                  {formatCurrency(item.subtotal)}
                </Text>
              </>
            )}
          </View>
        ))}

        {/* ── TOTALS ────────────────────────────────── */}
        <View style={s.totalsBox}>
          {!esUnidad && (
            <>
              <View style={s.totRow}>
                <Text style={s.totLabel}>Total KG:</Text>
                <Text style={s.totVal}>{orden.kg_total} kg</Text>
              </View>
              <View style={s.totRow}>
                <Text style={s.totLabel}>Tarifa por KG:</Text>
                <Text style={s.totVal}>{formatCurrency(orden.tarifa_kg)}</Text>
              </View>
            </>
          )}
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal:</Text>
            <Text style={s.totVal}>{formatCurrency(orden.valor)}</Text>
          </View>
          {esFE && (
            <View style={s.totRow}>
              <Text style={s.totLabel}>IVA (19%):</Text>
              <Text style={s.totVal}>{formatCurrency(orden.iva)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>TOTAL A PAGAR:</Text>
            <Text style={s.totalVal}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* ── OBSERVACIONES ─────────────────────────── */}
        {orden.observacion && (
          <View style={s.obsBox}>
            <Text style={s.obsLabel}>Observaciones</Text>
            <Text style={s.obsTxt}>{orden.observacion}</Text>
          </View>
        )}

        {/* ── FIRMAS ────────────────────────────────── */}
        <View style={s.firmas}>
          <View style={s.firmaBox}>
            <Text style={s.firmaTxt}>Entregado por cliente</Text>
          </View>
          <View style={s.firmaBox}>
            <Text style={s.firmaTxt}>Recibido por Servitratar G&G S.A.S.</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
