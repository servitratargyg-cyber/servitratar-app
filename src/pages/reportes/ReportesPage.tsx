import { BarChart3 } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function ReportesPage() {
  return (
    <div>
      <PageHeader title="Reportes" description="Informes y análisis" />
      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="Módulo de reportes en construcción"
        description="Se implementará en la Fase 8."
      />
    </div>
  );
}
