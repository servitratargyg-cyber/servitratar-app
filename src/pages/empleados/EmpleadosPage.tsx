import { UserCog } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function EmpleadosPage() {
  return (
    <div>
      <PageHeader title="Empleados" description="Gestión de personal" />
      <EmptyState
        icon={<UserCog className="h-12 w-12" />}
        title="Módulo de empleados en construcción"
        description="Se implementará en la Fase 6."
      />
    </div>
  );
}
