import { DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function NominaPage() {
  return (
    <div>
      <PageHeader title="Nómina" description="Liquidación mensual de nómina" />
      <EmptyState
        icon={<DollarSign className="h-12 w-12" />}
        title="Módulo de nómina en construcción"
        description="Se implementará en la Fase 6."
      />
    </div>
  );
}
