import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { useEmpleado } from '../../hooks/useEmpleados';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { AUX_TRANSPORTE_2026 } from '../../lib/constants';
import { CertificadoLaboralPDF } from '../../pdf/CertificadoLaboralPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { EmpleadoForm } from './EmpleadoForm';

const CONTRATO_LABEL: Record<string, string> = {
  INDEFINIDO:  'Término indefinido',
  FIJO:        'Término fijo',
  OBRA_LABOR:  'Obra o labor',
  PRESTACION:  'Prestación de servicios',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function EmpleadoDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const [editOpen,   setEditOpen]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: empleado, isLoading } = useEmpleado(id);

  if (isLoading) return <PageLoader />;

  if (!empleado) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-gray-500">No se encontró el empleado.</p>
        <Button variant="outline" onClick={() => navigate('/empleados')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
  const totalIngresos  = empleado.salario_base + (empleado.aux_transporte ? AUX_TRANSPORTE_2026 : 0);

  async function descargarCertificado() {
    if (!empleado) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(<CertificadoLaboralPDF empleado={empleado} />).toBlob();
      saveAs(blob, `Certificado_Laboral_${empleado.apellido}_${empleado.cedula}.pdf`);
    } catch {
      toast.error('Error al generar el certificado');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={nombreCompleto}
        breadcrumbs={[
          { label: 'Empleados', href: '/empleados' },
          { label: nombreCompleto },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/empleados')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Button variant="outline" onClick={descargarCertificado} disabled={pdfLoading}>
              <FileText className="h-4 w-4 mr-1" />
              {pdfLoading ? 'Generando...' : 'Certificado laboral'}
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </div>
        }
      />

      {/* ── KPI strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Salario base',       value: formatCurrency(empleado.salario_base), color: 'text-gray-800' },
          { label: 'Aux. transporte',    value: empleado.aux_transporte ? formatCurrency(AUX_TRANSPORTE_2026) : 'No aplica', color: empleado.aux_transporte ? 'text-gray-800' : 'text-gray-400' },
          { label: 'Total ingresos',     value: formatCurrency(totalIngresos), color: 'text-[#e8734a]' },
          { label: 'Estado',             value: empleado.estado, color: empleado.estado === 'ACTIVO' ? 'text-green-600' : 'text-red-500' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-base font-bold tabular-nums ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Datos personales ──────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Datos personales</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Nombre completo"   value={nombreCompleto} />
            <InfoRow label="Cédula"            value={empleado.cedula} />
            <InfoRow label="Fecha nacimiento"  value={empleado.fecha_nacimiento ? formatDate(empleado.fecha_nacimiento) : null} />
            <InfoRow label="Cargo"             value={empleado.cargo} />
            <InfoRow label="Tipo contrato"     value={empleado.tipo_contrato ? CONTRATO_LABEL[empleado.tipo_contrato] : null} />
            <InfoRow label="Fecha ingreso"     value={formatDate(empleado.fecha_ingreso)} />
            {empleado.fecha_retiro && (
              <InfoRow label="Fecha retiro" value={formatDate(empleado.fecha_retiro)} />
            )}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Estado:</span>
              <StatusBadge estado={empleado.estado} />
            </div>
          </CardContent>
        </Card>

        {/* ── Seguridad social ──────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Seguridad social</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="EPS"                  value={empleado.eps} />
            <InfoRow label="Pensión (AFP)"        value={empleado.afp} />
            <InfoRow label="ARL"                  value={empleado.arl} />
            <InfoRow label="Nivel de riesgo ARL"  value={empleado.nivel_riesgo ? `Clase ${empleado.nivel_riesgo}` : null} />
            <InfoRow label="Caja de compensación" value={empleado.caja_compensacion} />
          </CardContent>
        </Card>

        {/* ── Contacto y residencia ─────────────────── */}
        <Card>
          <CardHeader><CardTitle>Contacto y residencia</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Teléfono"  value={empleado.telefono} />
            <InfoRow label="Email"     value={empleado.email} />
            <InfoRow label="Dirección" value={empleado.direccion} />
            <InfoRow label="Barrio"    value={empleado.barrio} />
          </CardContent>
        </Card>

        {/* ── Datos bancarios ───────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Datos bancarios</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Banco"         value={empleado.banco} />
            <InfoRow label="Tipo cuenta"   value={empleado.tipo_cuenta} />
            <InfoRow label="No. de cuenta" value={empleado.cuenta_bancaria} />
          </CardContent>
        </Card>

        {/* ── Dotación ─────────────────────────────── */}
        {(empleado.talla_camisa || empleado.talla_pantalon || empleado.talla_botas) && (
          <Card>
            <CardHeader><CardTitle>Dotación</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Talla camisa"   value={empleado.talla_camisa} />
              <InfoRow label="Talla pantalón" value={empleado.talla_pantalon} />
              <InfoRow label="Talla botas"    value={empleado.talla_botas} />
            </CardContent>
          </Card>
        )}

        {/* ── Contacto de emergencia ────────────────── */}
        {(empleado.contacto_emergencia_nombre || empleado.contacto_emergencia_telefono) && (
          <Card>
            <CardHeader><CardTitle>Contacto de emergencia</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Nombre"     value={empleado.contacto_emergencia_nombre} />
              <InfoRow label="Parentesco" value={empleado.contacto_emergencia_parentesco} />
              <InfoRow label="Teléfono"   value={empleado.contacto_emergencia_telefono} />
            </CardContent>
          </Card>
        )}

      </div>

      <EmpleadoForm open={editOpen} onClose={() => setEditOpen(false)} empleado={empleado} />
    </div>
  );
}
