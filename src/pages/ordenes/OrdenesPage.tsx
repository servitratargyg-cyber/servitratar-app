import { ClipboardList } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function OrdenesPage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader
        title="Órdenes de Servicio"
        description="Gestión de órdenes TT"
        action={
          <Button onClick={() => navigate('/ordenes/nueva')}>
            + Nueva Orden
          </Button>
        }
      />
      <EmptyState
        icon={<ClipboardList className="h-12 w-12" />}
        title="Módulo de órdenes en construcción"
        description="Se implementará en la Fase 2."
      />
    </div>
  );
}
