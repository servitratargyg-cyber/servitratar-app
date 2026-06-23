import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Empleado } from '../types/supabase.types';
import { getEmpresaConfig } from '../services/config.service';
import { formatCurrency, formatDate } from '../lib/formatters';
import { AUX_TRANSPORTE_2026 } from '../lib/constants';

const LOGO_URL = `${window.location.origin}/logo.png`;

const CONTRATO_LABEL: Record<string, string> = {
  INDEFINIDO:  'término indefinido',
  FIJO:        'término fijo',
  OBRA_LABOR:  'obra o labor',
  PRESTACION:  'prestación de servicios',
};

const C = { dark: '#1a1a2e', accent: '#e8734a', gray: '#6b7280', border: '#e5e7eb' };

const s = StyleSheet.create({
  page: {
    width: 612, height: 792,
    paddingHorizontal: 54, paddingVertical: 48,
    fontSize: 10, fontFamily: 'Helvetica', color: '#111827',
  },

  // Header
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 16, borderBottom: `2 solid ${C.dark}` },
  logoWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:      { width: 52, height: 52, objectFit: 'contain' },
  empNombre: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.dark },
  empSub:    { fontSize: 8, color: C.gray, marginTop: 2 },
  docInfo:   { alignItems: 'flex-end', gap: 2 },
  docLabel:  { fontSize: 8, color: C.gray },
  docVal:    { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Title
  titleWrap: { alignItems: 'center', marginBottom: 30 },
  titleLine: { width: 40, height: 3, backgroundColor: C.accent, marginBottom: 8 },
  title:     { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.dark, letterSpacing: 1 },
  subtitle:  { fontSize: 8, color: C.gray, marginTop: 4, letterSpacing: 0.5 },

  // Body
  body:      { lineHeight: 1.8, fontSize: 10.5, color: '#1f2937', textAlign: 'justify', marginBottom: 20 },
  bold:      { fontFamily: 'Helvetica-Bold' },

  // Info box
  infoBox:   { backgroundColor: '#f9fafb', border: `1 solid ${C.border}`, borderRadius: 4, padding: 14, marginBottom: 24 },
  infoRow:   { flexDirection: 'row', marginBottom: 5 },
  infoKey:   { width: 160, fontSize: 9, color: C.gray },
  infoVal:   { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },

  // Footer / signature
  signWrap:  { marginTop: 48, flexDirection: 'row', justifyContent: 'space-between' },
  signBlock: { alignItems: 'center', width: 200 },
  signLine:  { width: '100%', borderTop: `1 solid ${C.dark}`, marginBottom: 6 },
  signName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.dark },
  signRole:  { fontSize: 8, color: C.gray },

  note: { fontSize: 7.5, color: C.gray, textAlign: 'center', marginTop: 36, lineHeight: 1.6 },
});

interface Props {
  empleado: Empleado;
}

export function CertificadoLaboralPDF({ empleado }: Props) {
  const empresa = getEmpresaConfig();
  const hoy     = new Date();
  const fechaDoc = formatDate(hoy.toLocaleDateString('en-CA'));
  const vigente  = empleado.estado !== 'RETIRADO';

  const salarioBase = formatCurrency(empleado.salario_base);
  const auxTransp   = empleado.aux_transporte
    ? ` más auxilio de transporte de ${formatCurrency(AUX_TRANSPORTE_2026)}`
    : '';
  const tipoCtrato  = empleado.tipo_contrato ? CONTRATO_LABEL[empleado.tipo_contrato] ?? empleado.tipo_contrato : 'indefinido';

  const periodoLaboral = vigente
    ? `desde el ${formatDate(empleado.fecha_ingreso)} y continúa vinculado(a) a la fecha`
    : `desde el ${formatDate(empleado.fecha_ingreso)} hasta el ${formatDate(empleado.fecha_retiro!)}`;

  return (
    <Document title={`Certificado Laboral — ${empleado.nombre} ${empleado.apellido}`}>
      <Page size="LETTER" style={s.page}>

        {/* ── Encabezado ─────────────────────────────── */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <Image src={LOGO_URL} style={s.logo} />
            <View>
              <Text style={s.empNombre}>{empresa.nombre}</Text>
              <Text style={s.empSub}>NIT: {empresa.nit}</Text>
              <Text style={s.empSub}>{empresa.direccion}</Text>
              <Text style={s.empSub}>Tel: {empresa.tel1}{empresa.tel2 ? ` · ${empresa.tel2}` : ''}</Text>
            </View>
          </View>
          <View style={s.docInfo}>
            <Text style={s.docLabel}>Bogotá D.C.,</Text>
            <Text style={s.docVal}>{fechaDoc}</Text>
          </View>
        </View>

        {/* ── Título ─────────────────────────────────── */}
        <View style={s.titleWrap}>
          <View style={s.titleLine} />
          <Text style={s.title}>CERTIFICADO LABORAL</Text>
          <Text style={s.subtitle}>DOCUMENTO OFICIAL — PARA USO EXTERNO</Text>
        </View>

        {/* ── Cuerpo ─────────────────────────────────── */}
        <Text style={s.body}>
          La empresa <Text style={s.bold}>{empresa.nombre}</Text>, identificada con NIT{' '}
          <Text style={s.bold}>{empresa.nit}</Text>, por medio del presente documento
        </Text>

        <Text style={[s.body, { fontSize: 11.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginVertical: 6 }]}>
          CERTIFICA QUE:
        </Text>

        <Text style={s.body}>
          <Text style={s.bold}>{empleado.nombre} {empleado.apellido}</Text>, identificado(a) con
          cédula de ciudadanía número{' '}
          <Text style={s.bold}>{empleado.cedula}</Text>, ha laborado en nuestra empresa{' '}
          <Text style={s.bold}>{periodoLaboral}</Text>, desempeñando el cargo de{' '}
          <Text style={s.bold}>{empleado.cargo ?? 'OPERARIO'}</Text>, bajo contrato a{' '}
          <Text style={s.bold}>{tipoCtrato}</Text>.
        </Text>

        {/* ── Tabla de datos laborales ────────────────── */}
        <View style={s.infoBox}>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Salario básico mensual:</Text>
            <Text style={s.infoVal}>{salarioBase}</Text>
          </View>
          {empleado.aux_transporte && (
            <View style={s.infoRow}>
              <Text style={s.infoKey}>Auxilio de transporte:</Text>
              <Text style={s.infoVal}>{formatCurrency(AUX_TRANSPORTE_2026)}</Text>
            </View>
          )}
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Total ingresos mensuales:</Text>
            <Text style={s.infoVal}>
              {formatCurrency(empleado.salario_base + (empleado.aux_transporte ? AUX_TRANSPORTE_2026 : 0))}
            </Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Tipo de contrato:</Text>
            <Text style={s.infoVal}>{tipoCtrato.charAt(0).toUpperCase() + tipoCtrato.slice(1)}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Fecha de ingreso:</Text>
            <Text style={s.infoVal}>{formatDate(empleado.fecha_ingreso)}</Text>
          </View>
          {!vigente && empleado.fecha_retiro && (
            <View style={s.infoRow}>
              <Text style={s.infoKey}>Fecha de retiro:</Text>
              <Text style={s.infoVal}>{formatDate(empleado.fecha_retiro)}</Text>
            </View>
          )}
          <View style={[s.infoRow, { marginBottom: 0 }]}>
            <Text style={s.infoKey}>Estado actual:</Text>
            <Text style={[s.infoVal, { color: vigente ? '#16a34a' : '#dc2626' }]}>
              {vigente ? 'VINCULADO(A) ACTUALMENTE' : 'RETIRADO(A)'}
            </Text>
          </View>
        </View>

        <Text style={s.body}>
          El presente certificado se expide a solicitud del(a) interesado(a) para los fines que
          estime convenientes.{auxTransp ? ` Se aclara que el(la) empleado(a) recibe${auxTransp} mensual.` : ''}
        </Text>

        {/* ── Firma ──────────────────────────────────── */}
        <View style={s.signWrap}>
          <View style={s.signBlock}>
            <View style={s.signLine} />
            <Text style={s.signName}>Representante Legal</Text>
            <Text style={s.signRole}>{empresa.nombre}</Text>
            <Text style={s.signRole}>NIT: {empresa.nit}</Text>
          </View>
        </View>

        {/* ── Nota de pie ────────────────────────────── */}
        <Text style={s.note}>
          Este certificado fue generado electrónicamente por el sistema de gestión de {empresa.nombre}.{'\n'}
          Fecha de emisión: {fechaDoc} · Tel: {empresa.tel1} · {empresa.direccion}
        </Text>

      </Page>
    </Document>
  );
}
