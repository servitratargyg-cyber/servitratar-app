import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, UserMinus, UserCheck } from 'lucide-react';
import { useEmpleados, useUpdateEmpleado } from '../../hooks/useEmpleados';
import type { Empleado } from '../../types/supabase.types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';
import { EmpleadoForm } from './EmpleadoForm';

const CONTRATO_LABEL: Record<string, string> = {
  INDEFINIDO:  'Indefinido',
  FIJO:        'Término fijo',
  OBRA_LABOR:  'Obra/labor',
  PRESTACION:  'Prestación',
};

export default function EmpleadosPage() {
  const navigate = useNavigate();
  const { data: empleados = [], isLoading } = useEmpleados();
  const update = useUpdateEmpleado();

  const [formOpen,    setFormOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<Empleado | null>(null);

  function openCreate() { setEditTarget(null); setFormOpen(true); }
  function openEdit(e: Empleado) { setEditTarget(e); setFormOpen(true); }

  const activos   = empleados.filter(e => e.estado === 'ACTIVO').length;
  const retirados = empleados.filter(e => e.estado === 'RETIRADO').length;

  const columns: Column<Empleado>[] = [
    {
      key:      'nombre',
      header:   'Empleado',
      accessor: 'nombre',
      sortable: true,
      cell:     row => (
        <div>
          <p className="font-medium text-gray-800">{row.nombre} {row.apellido}</p>
          <p className="text-xs text-gray-400 font-mono">{row.cedula}</p>
        </div>
      ),
    },
    {
      key:    'cargo',
      header: 'Cargo',
      cell:   row => row.cargo ?? <span className="text-gray-300">—</span>,
    },
    {
      key:    'tipo_contrato',
      header: 'Contrato',
      cell:   row => (
        <span className="text-xs text-gray-600">
          {row.tipo_contrato ? CONTRATO_LABEL[row.tipo_contrato] : '—'}
        </span>
      ),
    },
    {
      key:    'salario_base',
      header: 'Salario base',
      cell:   row => (
        <span className="tabular-nums font-medium">{formatCurrency(row.salario_base)}</span>
      ),
    },
    {
      key:    'aux_transporte',
      header: 'Aux. transp.',
      cell:   row => (
        <span className={row.aux_transporte ? 'text-green-600 text-xs' : 'text-gray-300 text-xs'}>
          {row.aux_transporte ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key:    'fecha_ingreso',
      header: 'Ingreso',
      cell:   row => <span className="text-xs">{formatDate(row.fecha_ingreso)}</span>,
    },
    {
      key:    'estado',
      header: 'Estado',
      cell:   row => <StatusBadge estado={row.estado} />,
    },
    {
      key:    'actions',
      header: '',
      cell:   row => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Ver detalle"
            onClick={() => navigate(`/empleados/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => openEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.estado === 'ACTIVO' ? (
            <Button
              variant="ghost"
              size="icon"
              title="Marcar como retirado"
              onClick={() => update.mutate({ id: row.id, values: { estado: 'RETIRADO', fecha_retiro: new Date().toLocaleDateString('en-CA') } })}
            >
              <UserMinus className="h-4 w-4 text-red-400" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="Reactivar"
              onClick={() => update.mutate({ id: row.id, values: { estado: 'ACTIVO', fecha_retiro: null } })}
            >
              <UserCheck className="h-4 w-4 text-green-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empleados"
        description={`${activos} activo${activos !== 1 ? 's' : ''} · ${retirados} retirado${retirados !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Empleados' }]}
        action={<Button onClick={openCreate}>+ Nuevo Empleado</Button>}
      />

      <DataTable
        columns={columns}
        data={empleados}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar por nombre, apellido o cédula..."
        emptyMessage="No hay empleados registrados. ¡Crea el primero!"
        onRowClick={row => navigate(`/empleados/${row.id}`)}
      />

      <EmpleadoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        empleado={editTarget}
      />
    </div>
  );
}
