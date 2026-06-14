import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { empleadoFormSchema, type EmpleadoFormData } from '../../schemas/empleado.schema';
import { useCreateEmpleado, useUpdateEmpleado } from '../../hooks/useEmpleados';
import type { Empleado } from '../../types/supabase.types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

interface EmpleadoFormProps {
  open:      boolean;
  onClose:   () => void;
  empleado?: Empleado | null;
}

const DEFAULTS: EmpleadoFormData = {
  nombre:            '',
  apellido:          '',
  cedula:            '',
  cargo:             '',
  tipo_contrato:     'INDEFINIDO',
  fecha_ingreso:     '',
  fecha_retiro:      '',
  salario_base:      0,
  aux_transporte:    true,
  cuenta_bancaria:   '',
  banco:             '',
  tipo_cuenta:       null as ('AHORROS' | 'CORRIENTE' | null),
  eps:               '',
  afp:               '',
  arl:               '',
  caja_compensacion: '',
  estado:            'ACTIVO',
};

function toNull(v: string): string | null {
  return v.trim() === '' ? null : v.trim();
}

export function EmpleadoForm({ open, onClose, empleado }: EmpleadoFormProps) {
  const isEdit = !!empleado;
  const create = useCreateEmpleado();
  const update = useUpdateEmpleado();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormData>({
    resolver: zodResolver(empleadoFormSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      empleado
        ? {
            nombre:            empleado.nombre,
            apellido:          empleado.apellido,
            cedula:            empleado.cedula,
            cargo:             empleado.cargo             ?? '',
            tipo_contrato:     empleado.tipo_contrato     ?? 'INDEFINIDO',
            fecha_ingreso:     empleado.fecha_ingreso,
            fecha_retiro:      empleado.fecha_retiro      ?? '',
            salario_base:      empleado.salario_base,
            aux_transporte:    empleado.aux_transporte,
            cuenta_bancaria:   empleado.cuenta_bancaria   ?? '',
            banco:             empleado.banco             ?? '',
            tipo_cuenta:       empleado.tipo_cuenta       ?? null,
            eps:               empleado.eps               ?? '',
            afp:               empleado.afp               ?? '',
            arl:               empleado.arl               ?? '',
            caja_compensacion: empleado.caja_compensacion ?? '',
            estado:            empleado.estado,
          }
        : DEFAULTS
    );
  }, [open, empleado, reset]);

  async function onSubmit(data: EmpleadoFormData) {
    const payload = {
      nombre:            data.nombre.trim().toUpperCase(),
      apellido:          data.apellido.trim().toUpperCase(),
      cedula:            data.cedula.trim(),
      cargo:             toNull(data.cargo),
      tipo_contrato:     data.tipo_contrato,
      fecha_ingreso:     data.fecha_ingreso,
      fecha_retiro:      toNull(data.fecha_retiro),
      salario_base:      data.salario_base,
      aux_transporte:    data.aux_transporte,
      cuenta_bancaria:   toNull(data.cuenta_bancaria),
      banco:             toNull(data.banco),
      tipo_cuenta:       data.tipo_cuenta ?? null,
      eps:               toNull(data.eps),
      afp:               toNull(data.afp),
      arl:               toNull(data.arl),
      caja_compensacion: toNull(data.caja_compensacion),
      estado:            data.estado,
    } satisfies Omit<Empleado, 'id' | 'created_at' | 'updated_at'>;

    if (isEdit && empleado) {
      await update.mutateAsync({ id: empleado.id, values: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar empleado' : 'Nuevo empleado'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Datos personales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="JUAN" {...register('nombre')} className="uppercase" />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Apellido *</Label>
            <Input placeholder="PÉREZ" {...register('apellido')} className="uppercase" />
            {errors.apellido && <p className="text-xs text-red-500">{errors.apellido.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cédula *</Label>
            <Input placeholder="10000000" {...register('cedula')} />
            {errors.cedula && <p className="text-xs text-red-500">{errors.cedula.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cargo</Label>
            <Input placeholder="Operario" {...register('cargo')} />
          </div>
        </div>

        {/* Contrato */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo contrato</Label>
            <Select {...register('tipo_contrato')}>
              <option value="INDEFINIDO">Indefinido</option>
              <option value="FIJO">Término fijo</option>
              <option value="OBRA_LABOR">Obra o labor</option>
              <option value="PRESTACION">Prestación de servicios</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha ingreso *</Label>
            <Input type="date" {...register('fecha_ingreso')} />
            {errors.fecha_ingreso && <p className="text-xs text-red-500">{errors.fecha_ingreso.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Salario base *</Label>
            <Input
              type="number"
              step="1000"
              min="0"
              placeholder="1423500"
              {...register('salario_base', { valueAsNumber: true })}
            />
            {errors.salario_base && <p className="text-xs text-red-500">{errors.salario_base.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha retiro</Label>
            <Input type="date" {...register('fecha_retiro')} />
          </div>
        </div>

        {/* Seguridad social */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Seguridad social</p>
        <div className="grid grid-cols-2 gap-3">
          {(['eps', 'afp', 'arl', 'caja_compensacion'] as const).map(field => (
            <div key={field} className="flex flex-col gap-1.5">
              <Label>{field === 'caja_compensacion' ? 'Caja de compensación' : field.toUpperCase()}</Label>
              <Input placeholder={field === 'eps' ? 'Sura, Sanitas...' : field === 'afp' ? 'Porvenir, Colpensiones...' : ''} {...register(field)} />
            </div>
          ))}
        </div>

        {/* Datos bancarios */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">Datos bancarios</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Banco</Label>
            <Input placeholder="Bancolombia, Davivienda..." {...register('banco')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de cuenta</Label>
            <Select {...register('tipo_cuenta')}>
              <option value="">Sin especificar</option>
              <option value="AHORROS">Ahorros</option>
              <option value="CORRIENTE">Corriente</option>
            </Select>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Número de cuenta</Label>
            <Input placeholder="000-000000-00" {...register('cuenta_bancaria')} />
          </div>
        </div>

        {/* Opciones adicionales */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('aux_transporte')}
            />
            <span className="text-sm text-gray-700">Aplica auxilio de transporte</span>
          </label>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select {...register('estado')}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="RETIRADO">Retirado</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear empleado'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
