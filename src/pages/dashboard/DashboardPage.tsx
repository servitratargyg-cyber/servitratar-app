import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen ejecutivo del negocio"
      />
      <EmptyState
        icon={<LayoutDashboard className="h-12 w-12" />}
        title="Dashboard en construcción"
        description="Esta sección se habilitará en la Fase 5."
      />
    </div>
  );
}
