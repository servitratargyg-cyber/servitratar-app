import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inventarioItemSchema, type InventarioItemFormData } from '../../schemas/inventario.schema';
import { useCreateInventarioItem, useUpdateInventarioItem } from '../../hooks/useInventario';
import type { InventarioItem } from '../../types/supabase.types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

interface Props {
  open:   boolean;
  onClose: () => void;
  item?:  InventarioItem | null;
}

const DEFAULTS: InventarioItemFormData = {
  codigo:          '',
  nombre:          '',
  descripcion:     '',
  categoria:       '',
  unidad:          'und',
  stock_actual:    0,
  stock_minimo:    0,
  precio_unitario: 0,
  proveedor:       '',
  ubicacion:       '',
  activo:          true,
};

function toNull(v: string) { return v.trim() === '' ? null : v.trim(); }

export function InventarioItemForm({ open, onClose, item }: Props) {
  const isEdit = !!item;
  const create = useCreateInventarioItem();
  const update = useUpdateInventarioItem();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventarioItemFormData>({
    resolver:      zodResolver(inventarioItemSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      item
        ? {
            codigo:          item.codigo,
            nombre:          item.nombre,
            descripcion:     item.descripcion     ?? '',
            categoria:       item.categoria       ?? '',
            unidad:          item.unidad,
            stock_actual:    item.stock_actual,
            stock_minimo:    item.stock_minimo,
            precio_unitario: item.precio_unitario,
            proveedor:       item.proveedor        ?? '',
            ubicacion:       item.ubicacion        ?? '',
            activo:          item.activo,
          }
        : DEFAULTS
    );
  }, [open, item, reset]);

  async function onSubmit(data: InventarioItemFormData) {
    const payload = {
      codigo:          data.codigo.trim().toUpperCase(),
      nombre:          data.nombre.trim().toUpperCase(),
      descripcion:     toNull(data.descripcion),
      categoria:       toNull(data.categoria),
      unidad:          data.unidad.trim(),
      stock_actual:    data.stock_actual,
      stock_minimo:    data.stock_minimo,
      precio_unitario: data.precio_unitario,
      proveedor:       toNull(data.proveedor),
      ubicacion:       toNull(data.ubicacion),
      activo:          data.activo,
    } satisfies Omit<InventarioItem, 'id' | 'created_at' | 'updated_at'>;

    if (isEdit && item) {
      await update.mutateAsync({ id: item.id, values: payload });
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
      title={isEdit ? 'Editar ítem' : 'Nuevo ítem de inventario'}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Código *</Label>
            <Input placeholder="MAT-001" {...register('codigo')} className="uppercase" />
            {errors.codigo && <p className="text-xs text-red-500">{errors.codigo.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Input placeholder="Combustibles, Herramientas..." {...register('categoria')} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="ACEITE PARA TEMPLE" {...register('nombre')} className="uppercase" />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Descripción</Label>
            <Input placeholder="Descripción opcional..." {...register('descripcion')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Unidad *</Label>
            <Select {...register('unidad')}>
              <option value="und">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="lt">Litro</option>
              <option value="m">Metro</option>
              <option value="caja">Caja</option>
              <option value="rollo">Rollo</option>
              <option value="par">Par</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Stock actual</Label>
            <Input type="number" min="0" step="0.01" {...register('stock_actual', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Stock mínimo</Label>
            <Input type="number" min="0" step="0.01" {...register('stock_minimo', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Precio unitario ($)</Label>
            <Input type="number" min="0" step="100" placeholder="0" {...register('precio_unitario', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Proveedor</Label>
            <Input placeholder="Nombre del proveedor" {...register('proveedor')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ubicación</Label>
            <Input placeholder="Bodega A, Estante 3..." {...register('ubicacion')} />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" {...register('activo')} />
              <span className="text-sm text-gray-700">Ítem activo</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" disabled={isPending || isSubmitting}>
            {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear ítem'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
