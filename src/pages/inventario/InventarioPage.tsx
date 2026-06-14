import { Package } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';

export default function InventarioPage() {
  return (
    <div>
      <PageHeader title="Inventario" description="Control de materiales e insumos" />
      <EmptyState
        icon={<Package className="h-12 w-12" />}
        title="Módulo de inventario en construcción"
        description="Se implementará en la Fase 7."
      />
    </div>
  );
}
