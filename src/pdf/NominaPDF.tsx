import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { NominaConEmpleado } from '../services/nomina.service';
import { getEmpresaConfig } from '../services/config.service';
import { formatCurrency, formatDate, getMesNombre } from '../lib/formatters';
import logo from '../assets/logo.png';

// Carta: 612 × 792 pt
const C = {
  dark:   '#1a1a2e',
  accent: '#e8734a',
  gray:   '#6b7280',
  border: '#e5e7eb',
  light:  '#f9fafb',
  red:    '#dc2626',
};

const s = StyleSheet.create({
  page: {
    width: 612, height: 792,
    paddingHorizontal: 36, paddingVertical: 30,
    fontSize: 7.5, fontFamily: 'Helvetica', color: '#111827',
  },

  // ── Header ───────────────────────────────────────────────
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: `2 solid ${C.dark}` },
  empresaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:       { width: 50, height: 50, objectFit: 'contain' },
  empresa:    { gap: 1.5 },
  empNombre:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark },
  empSub:     { fontSize: 6.5, color: C.gray },
  badge:      { backgroundColor: C.dark, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  badgeType:  { fontSize: 6, color: C.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5 },
  badgeTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'white', marginTop: 2 },

  // ── Empleado / período ───────────────────────────────────
  infoRow:   { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox:   { flex: 1, backgroundColor: C.light, borderRadius: 4, padding: 8, gap: 3 },
  infoTitle: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2, borderBottom: `0.5 solid ${C.border}`, paddingBottom: 2 },
  infoLine:  { flexDirection: 'row', gap: 4 },
  infoLabel: { fontSize: 6.5, color: C.gray, width: 70 },
  infoVal:   { fontSize: 6.5, color: C.dark, fontFamily: 'Helvetica-Bold', flex: 1 },

  // ── Tabla devengado/deducciones ──────────────────────────
  tableWrap:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  col:        { flex: 1 },
  colHead:    { flexDirection: 'row', backgroundColor: C.dark, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 4, marginBottom: 1 },
  colHeadTxt: { fontSize: 6, color: 'white', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', flex: 1 },
  colRow:     { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 3, borderBottom: `0.5 solid ${C.border}` },
  colRowAlt:  { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 3, borderBottom: `0.5 solid ${C.border}`, backgroundColor: C.light },
  colLabel:   { fontSize: 6.5, color: '#374151', flex: 1 },
  colVal:     { fontSize: 6.5, color: '#374151', textAlign: 'right' },
  colValRed:  { fontSize: 6.5, color: C.red, textAlign: 'right' },
  colTotal:   { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4, backgroundColor: C.dark, borderRadius: 3, marginTop: 1 },
  colTotLbl:  { fontSize: 6.5, color: 'white', fontFamily: 'Helvetica-Bold', flex: 1 },
  colTotVal:  { fontSize: 6.5, color: C.accent, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  colTotRed:  { fontSize: 6.5, color: '#fca5a5', fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // ── Neto a pagar ─────────────────────────────────────────
  netoBox:   { backgroundColor: C.accent, borderRadius: 5, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  netoLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'white' },
  netoVal:   { fontSize: 14, fontFamily: 'Helvetica-Bold', color: 'white' },

  // ── Sección informativa ──────────────────────────────────
  infoSecRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  infoSec:      { flex: 1, border: `0.5 solid ${C.border}`, borderRadius: 3, padding: 6 },
  infoSecTitle: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, paddingBottom: 2, borderBottom: `0.5 solid ${C.border}` },
  infoSecLine:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  infoSecLbl:   { fontSize: 6.5, color: C.gray, flex: 1 },
  infoSecVal:   { fontSize: 6.5, color: '#374151', textAlign: 'right' },

  // ── Observación ──────────────────────────────────────────
  obsBox:   { border: `0.5 solid ${C.border}`, borderRadius: 3, padding: 6, marginBottom: 16 },
  obsTitle: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', marginBottom: 3 },
  obsTxt:   { fontSize: 6.5, color: '#374151' },

  // ── Firmas ───────────────────────────────────────────────
  firmas:   { flexDirection: 'row', gap: 40, marginTop: 'auto' },
  firmaBox: { flex: 1, alignItems: 'center' },
  firmaLine:{ borderTop: `0.75 solid ${C.dark}`, width: '100%', marginBottom: 4 },
  firmaNom: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.dark },
  firmaCC:  { fontSize: 6.5, color: C.gray },
  firmaRol: { fontSize: 6, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Footer ───────────────────────────────────────────────
  footer:   { borderTop: `0.5 solid ${C.border}`, paddingTop: 5, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footTxt:  { fontSize: 5.5, color: C.gray },
});

interface NominaPDFProps {
  nomina: NominaConEmpleado;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoLine}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoVal}>{value}</Text>
    </View>
  );
}

function TRow({ label, value, alt, red }: { label: string; value: number; alt?: boolean; red?: boolean }) {
  const rowStyle  = alt ? s.colRowAlt : s.colRow;
  const valStyle  = red ? s.colValRed : s.colVal;
  const prefix    = red && value > 0 ? '− ' : '';
  return (
    <View style={rowStyle}>
      <Text style={s.colLabel}>{label}</Text>
      <Text style={valStyle}>{prefix}{formatCurrency(value)}</Text>
    </View>
  );
}

function SecLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.infoSecLine}>
      <Text style={s.infoSecLbl}>{label}</Text>
      <Text style={s.infoSecVal}>{formatCurrency(value)}</Text>
    </View>
  );
}

export function NominaPDF({ nomina }: NominaPDFProps) {
  const empresa        = getEmpresaConfig();
  const { empleado }   = nomina;
  const salarioProp    = Math.round((nomina.salario_base / 30) * nomina.dias_trabajados);
  const periodoLabel   = `${getMesNombre(nomina.periodo_mes).toUpperCase()} ${nomina.periodo_anio}`;
  const fechaImpresion = formatDate(new Date().toISOString());

  return (
    <Document>
      <Page size={[612, 792]} style={s.page}>

        {/* ── HEADER ─────────────────────────────────────── */}
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
            <Text style={s.badgeType}>RECURSOS HUMANOS</Text>
            <Text style={s.badgeTitle}>COMPROBANTE</Text>
            <Text style={s.badgeTitle}>DE NÓMINA</Text>
          </View>
        </View>

        {/* ── EMPLEADO + PERÍODO ─────────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Datos del empleado</Text>
            <InfoLine label="Nombre"   value={`${empleado.nombre} ${empleado.apellido}`} />
            <InfoLine label="Cédula"   value={empleado.cedula} />
            <InfoLine label="Cargo"    value={empleado.cargo ?? '—'} />
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Período liquidado</Text>
            <InfoLine label="Período"          value={periodoLabel} />
            <InfoLine label="Días trabajados"  value={`${nomina.dias_trabajados} de 30`} />
            <InfoLine label="Estado"           value={nomina.estado} />
            {nomina.fecha_pago && (
              <InfoLine label="Fecha de pago"  value={formatDate(nomina.fecha_pago)} />
            )}
          </View>
        </View>

        {/* ── DEVENGADO / DEDUCCIONES ────────────────────── */}
        <View style={s.tableWrap}>

          {/* Devengado */}
          <View style={s.col}>
            <View style={s.colHead}>
              <Text style={s.colHeadTxt}>Ingresos / Devengado</Text>
            </View>
            <TRow label="Salario base proporcional" value={salarioProp} />
            {nomina.aux_transporte > 0 && (
              <TRow label="Auxilio de transporte" value={nomina.aux_transporte} alt />
            )}
            {nomina.horas_extras > 0 && (
              <TRow label="Horas extras" value={nomina.horas_extras} />
            )}
            {nomina.otros_ingresos > 0 && (
              <TRow label="Otros ingresos" value={nomina.otros_ingresos} alt />
            )}
            <View style={s.colTotal}>
              <Text style={s.colTotLbl}>Total devengado</Text>
              <Text style={s.colTotVal}>{formatCurrency(nomina.total_devengado)}</Text>
            </View>
          </View>

          {/* Deducciones */}
          <View style={s.col}>
            <View style={s.colHead}>
              <Text style={s.colHeadTxt}>Deducciones empleado</Text>
            </View>
            <TRow label="Salud empleado (4%)"    value={nomina.salud_empleado}   red />
            <TRow label="Pensión empleado (4%)"  value={nomina.pension_empleado} alt red />
            {nomina.retencion_fte > 0 && (
              <TRow label="Retención en la fuente" value={nomina.retencion_fte} red />
            )}
            {nomina.otras_deducciones > 0 && (
              <TRow label="Otras deducciones" value={nomina.otras_deducciones} alt red />
            )}
            <View style={s.colTotal}>
              <Text style={s.colTotLbl}>Total deducciones</Text>
              <Text style={s.colTotRed}>− {formatCurrency(nomina.total_deducciones)}</Text>
            </View>
          </View>
        </View>

        {/* ── NETO A PAGAR ───────────────────────────────── */}
        <View style={s.netoBox}>
          <Text style={s.netoLabel}>NETO A PAGAR</Text>
          <Text style={s.netoVal}>{formatCurrency(nomina.neto_pagar)}</Text>
        </View>

        {/* ── APORTES EMPLEADOR + PRESTACIONES ──────────── */}
        <View style={s.infoSecRow}>
          <View style={s.infoSec}>
            <Text style={s.infoSecTitle}>Aportes empleador (costo empresa)</Text>
            <SecLine label="Salud (8.5%)"   value={nomina.salud_empleador}  />
            <SecLine label="Pensión (12%)"  value={nomina.pension_empleador} />
            <SecLine label="ARL"            value={nomina.arl}              />
            <SecLine label="Caja (4%)"      value={nomina.caja}             />
            <SecLine label="SENA (2%)"      value={nomina.sena}             />
            <SecLine label="ICBF (3%)"      value={nomina.icbf}             />
          </View>
          <View style={s.infoSec}>
            <Text style={s.infoSecTitle}>Provisiones prestaciones sociales</Text>
            <SecLine label="Cesantías (8.33%)"     value={nomina.cesantias}     />
            <SecLine label="Int. cesantías (1%)"   value={nomina.intereses_ces} />
            <SecLine label="Prima (8.33%)"         value={nomina.prima}         />
            <SecLine label="Vacaciones (4.17%)"    value={nomina.vacaciones}    />
            <View style={[s.infoSecLine, { marginTop: 3, borderTop: `0.5 solid ${C.border}`, paddingTop: 3 }]}>
              <Text style={[s.infoSecLbl, { fontFamily: 'Helvetica-Bold', color: C.dark }]}>Total provisiones</Text>
              <Text style={[s.infoSecVal, { fontFamily: 'Helvetica-Bold', color: C.dark }]}>
                {formatCurrency(nomina.cesantias + nomina.intereses_ces + nomina.prima + nomina.vacaciones)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── OBSERVACIÓN ────────────────────────────────── */}
        {nomina.observacion && (
          <View style={s.obsBox}>
            <Text style={s.obsTitle}>Observaciones</Text>
            <Text style={s.obsTxt}>{nomina.observacion}</Text>
          </View>
        )}

        {/* ── FIRMAS ─────────────────────────────────────── */}
        <View style={s.firmas}>
          <View style={s.firmaBox}>
            <View style={s.firmaLine} />
            <Text style={s.firmaNom}>{empleado.nombre} {empleado.apellido}</Text>
            <Text style={s.firmaCC}>C.C. {empleado.cedula}</Text>
            <Text style={s.firmaRol}>Empleado</Text>
          </View>
          <View style={s.firmaBox}>
            <View style={s.firmaLine} />
            <Text style={s.firmaNom}>{empresa.nombre}</Text>
            <Text style={s.firmaCC}>NIT: {empresa.nit}</Text>
            <Text style={s.firmaRol}>Empleador</Text>
          </View>
        </View>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footTxt}>Comprobante generado el {fechaImpresion}</Text>
          <Text style={s.footTxt}>Este documento es un comprobante interno de liquidación de nómina</Text>
        </View>

      </Page>
    </Document>
  );
}
