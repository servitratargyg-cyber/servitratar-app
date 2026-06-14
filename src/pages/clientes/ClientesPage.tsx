import { Users } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function ClientesPage() {
  return (
    <div>
      <PageHeader title="Clientes" description="Base de datos de clientes" />
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Módulo de clientes en construcción"
        description="Se implementará en la Fase 3."
      />
    </div>
  );
}
