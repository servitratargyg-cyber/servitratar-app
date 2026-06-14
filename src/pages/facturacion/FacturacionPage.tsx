import { FileText } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function FacturacionPage() {
  return (
    <div>
      <PageHeader title="Facturación" description="Facturas electrónicas" />
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="Módulo de facturación en construcción"
        description="Se implementará en la Fase 4."
      />
    </div>
  );
}
