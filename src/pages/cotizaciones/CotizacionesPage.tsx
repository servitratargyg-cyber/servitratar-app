import { FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function CotizacionesPage() {
  return (
    <div>
      <PageHeader title="Cotizaciones" description="Gestión de cotizaciones" />
      <EmptyState
        icon={<FileSpreadsheet className="h-12 w-12" />}
        title="Módulo de cotizaciones en construcción"
        description="Se implementará en la Fase 3."
      />
    </div>
  );
}
