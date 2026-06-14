import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useClientes, useToggleClienteEstado } from '../../hooks/useClientes';
import type { Cliente } from '../../types/supabase.types';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable, type Column } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';
import { ClienteForm } from './ClienteForm';

export default function ClientesPage() {
  const navigate   = useNavigate();
  const toggle     = useToggleClienteEstado();

  const { data: clientes = [], isLoading } = useClientes();

  const [formOpen,     setFormOpen]     = useState(false);
  const [editCliente,  setEditCliente]  = useState<Cliente | null>(null);

  function openCreate() { setEditCliente(null); setFormOpen(true); }
  function openEdit(c: Cliente) { setEditCliente(c); setFormOpen(true); }

  const columns: Column<Cliente>[] = [
    {
      key:      'nombre',
      header:   'Nombre',
      accessor: 'nombre',
      sortable: true,
      cell:     row => (
        <span className="font-medium text-gray-800">{row.nombre}</span>
      ),
    },
    {
      key:      'nit',
      header:   'NIT',
      accessor: 'nit',
      cell:     row => <span className="font-mono text-xs">{row.nit ?? '—'}</span>,
    },
    {
      key:      'ciudad',
      header:   'Ciudad',
      accessor: 'ciudad',
      cell:     row => row.ciudad ?? 'BOGOTÁ',
    },
    {
      key:    'telefono',
      header: 'Teléfono',
      cell:   row => row.telefono ?? '—',
    },
    {
      key:    'modo_cobro',
      header: 'Modo',
      cell:   row => (
        <span className="font-mono text-xs text-gray-500">{row.modo_cobro}</span>
      ),
    },
    {
      key:    'aplica_ret',
      header: 'Ret.',
      cell:   row => (
        <span className={row.aplica_ret ? 'text-green-600 text-xs' : 'text-gray-300 text-xs'}>
          {row.aplica_ret ? 'Sí' : 'No'}
        </span>
      ),
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
            onClick={() => navigate(`/clientes/${row.id}`)}
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
          <Button
            variant="ghost"
            size="icon"
            title={row.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
            onClick={() =>
              toggle.mutate({
                id:     row.id,
                estado: row.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
              })
            }
          >
            {row.estado === 'ACTIVO'
              ? <ToggleRight className="h-4 w-4 text-green-600" />
              : <ToggleLeft  className="h-4 w-4 text-gray-400" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Clientes' }]}
        action={
          <Button onClick={openCreate}>+ Nuevo Cliente</Button>
        }
      />

      <DataTable
        columns={columns}
        data={clientes}
        loading={isLoading}
        searchable
        searchPlaceholder="Buscar por nombre o NIT..."
        emptyMessage="No hay clientes registrados. ¡Crea el primero!"
        onRowClick={row => navigate(`/clientes/${row.id}`)}
      />

      <ClienteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        cliente={editCliente}
      />
    </div>
  );
}
