import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteFormSchema, type ClienteFormData } from '../../schemas/cliente.schema';
import { useCreateCliente, useUpdateCliente } from '../../hooks/useClientes';
import type { Cliente } from '../../types/supabase.types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

interface ClienteFormProps {
  open:      boolean;
  onClose:   () => void;
  cliente?:  Cliente | null;
}

export function ClienteForm({ open, onClose, cliente }: ClienteFormProps) {
  const isEdit = !!cliente;
  const create = useCreateCliente();
  const update = useUpdateCliente();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nombre:         '',
      razon_social:   '',
      nit:            '',
      direccion:      '',
      ciudad:         'BOGOTÁ',
      convenio:       '',
      telefono:       '',
      email:          '',
      tarifa_defecto: 0,
      modo_cobro:     'KG',
      tipo_doc:       'O.S.',
      aplica_ret:     false,
      estado:         'ACTIVO',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        cliente
          ? {
              nombre:         cliente.nombre,
              razon_social:   cliente.razon_social ?? '',
              nit:            cliente.nit ?? '',
              direccion:      cliente.direccion ?? '',
              ciudad:         cliente.ciudad ?? 'BOGOTÁ',
              convenio:       cliente.convenio ?? '',
              telefono:       cliente.telefono ?? '',
              email:          cliente.email ?? '',
              tarifa_defecto: cliente.tarifa_defecto,
              modo_cobro:     cliente.modo_cobro,
              tipo_doc:       cliente.tipo_doc,
              aplica_ret:     cliente.aplica_ret,
              estado:         cliente.estado,
            }
          : {
              nombre: '', razon_social: '', nit: '', direccion: '',
              ciudad: 'BOGOTÁ', convenio: '', telefono: '', email: '',
              tarifa_defecto: 0, modo_cobro: 'KG', tipo_doc: 'O.S.',
              aplica_ret: false, estado: 'ACTIVO',
            }
      );
    }
  }, [open, cliente, reset]);

  function toNullable(v: string): string | null {
    return v.trim() === '' ? null : v.trim();
  }

  async function onSubmit(data: ClienteFormData) {
    const payload = {
      nombre:         data.nombre.toUpperCase().trim(),
      razon_social:   toNullable(data.razon_social),
      nit:            toNullable(data.nit),
      direccion:      toNullable(data.direccion),
      ciudad:         toNullable(data.ciudad) ?? 'BOGOTÁ',
      convenio:       toNullable(data.convenio),
      telefono:       toNullable(data.telefono),
      email:          toNullable(data.email),
      tarifa_defecto: data.tarifa_defecto,
      modo_cobro:     data.modo_cobro,
      tipo_doc:       data.tipo_doc,
      aplica_ret:     data.aplica_ret,
      estado:         data.estado,
    } satisfies Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

    if (isEdit && cliente) {
      await update.mutateAsync({ id: cliente.id, values: payload });
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
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Fila 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Nombre *</Label>
            <Input
              placeholder="EMPRESA S.A.S."
              {...register('nombre')}
              className="uppercase"
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Razón social</Label>
            <Input placeholder="Nombre completo legal" {...register('razon_social')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>NIT</Label>
            <Input placeholder="900.000.000-0" {...register('nit')} />
          </div>
        </div>

        {/* Fila 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="310 000 0000" {...register('telefono')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="contacto@empresa.com" {...register('email')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Dirección</Label>
            <Input placeholder="Cra 00 No. 00-00" {...register('direccion')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ciudad</Label>
            <Input placeholder="BOGOTÁ" {...register('ciudad')} />
          </div>
        </div>

        {/* Fila 3 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Convenio</Label>
            <Input placeholder="Código de convenio (opcional)" {...register('convenio')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tarifa por defecto ($/kg o $/und)</Label>
            <Input
              type="number"
              step="100"
              min="0"
              placeholder="0"
              {...register('tarifa_defecto', { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Modo de cobro</Label>
            <Select {...register('modo_cobro')}>
              <option value="KG">Por KG</option>
              <option value="UNIDAD">Por Unidad</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de documento</Label>
            <Select {...register('tipo_doc')}>
              <option value="O.S.">O.S. — Orden de Servicio</option>
              <option value="F.E.">F.E. — Factura Electrónica</option>
            </Select>
          </div>
        </div>

        {/* Fila 4 */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#e8734a]"
              {...register('aplica_ret')}
            />
            <span className="text-sm text-gray-700">Aplica retenciones</span>
          </label>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select {...register('estado')}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear cliente'}
          </Button>
        </div>

      </form>
    </Dialog>
  );
}
