import { Wallet } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function CarteraPage() {
  return (
    <div>
      <PageHeader title="Cartera" description="Facturas pendientes de cobro" />
      <EmptyState
        icon={<Wallet className="h-12 w-12" />}
        title="Módulo de cartera en construcción"
        description="Se implementará en la Fase 4."
      />
    </div>
  );
}
