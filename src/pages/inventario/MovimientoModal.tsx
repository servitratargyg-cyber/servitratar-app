import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react';
import { movimientoSchema, type MovimientoFormData } from '../../schemas/inventario.schema';
import { useRegistrarMovimiento } from '../../hooks/useInventario';
import { useAuth } from '../../hooks/useAuth';
import type { InventarioItem } from '../../types/supabase.types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

interface Props {
  item:    InventarioItem | null;
  onClose: () => void;
}

const TIPO_CONFIG = {
  ENTRADA: { label: 'Entrada',  icon: ArrowDownCircle, color: 'text-green-600', desc: 'Cantidad a ingresar al inventario'    },
  SALIDA:  { label: 'Salida',   icon: ArrowUpCircle,   color: 'text-red-500',   desc: 'Cantidad a retirar del inventario'    },
  AJUSTE:  { label: 'Ajuste',   icon: SlidersHorizontal, color: 'text-blue-500', desc: 'Nuevo stock total (conteo físico)'  },
};

export function MovimientoModal({ item, onClose }: Props) {
  const { user }  = useAuth();
  const registrar = useRegistrarMovimiento(user?.id ?? null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoFormData>({
    resolver:      zodResolver(movimientoSchema),
    defaultValues: { tipo: 'ENTRADA', cantidad: 0, referencia: '', nota: '' },
  });

  const [tipo, cantidad] = useWatch({ control, name: ['tipo', 'cantidad'] });

  useEffect(() => {
    if (item) reset({ tipo: 'ENTRADA', cantidad: 0, referencia: '', nota: '' });
  }, [item, reset]);

  function calcStockPreview(): number | null {
    if (!item) return null;
    const cant = Number(cantidad) || 0;
    if (tipo === 'ENTRADA') return item.stock_actual + cant;
    if (tipo === 'SALIDA')  return Math.max(0, item.stock_actual - cant);
    return cant; // AJUSTE = nuevo total
  }

  async function onSubmit(data: MovimientoFormData) {
    if (!item) return;
    await registrar.mutateAsync({ item, form: data });
    onClose();
  }

  const stockPreview = calcStockPreview();
  const cfg = TIPO_CONFIG[tipo as keyof typeof TIPO_CONFIG] ?? TIPO_CONFIG.ENTRADA;
  const Icon = cfg.icon;

  return (
    <Dialog open={!!item} onClose={onClose} title="Registrar movimiento" className="max-w-md">
      {item && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Info del ítem */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-xs text-gray-400">{item.codigo}</p>
                <p className="font-semibold text-gray-800">{item.nombre}</p>
                {item.ubicacion && <p className="text-xs text-gray-400 mt-0.5">📍 {item.ubicacion}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stock actual</p>
                <p className="text-xl font-bold text-[#1a1a2e]">{item.stock_actual} <span className="text-sm font-normal text-gray-400">{item.unidad}</span></p>
              </div>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de movimiento</Label>
            <Select {...register('tipo')}>
              <option value="ENTRADA">Entrada — ingreso de stock</option>
              <option value="SALIDA">Salida — consumo o despacho</option>
              <option value="AJUSTE">Ajuste — conteo físico</option>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="flex flex-col gap-1.5">
            <Label>
              <span className={cfg.color}>
                <Icon className="h-3.5 w-3.5 inline mr-1" />
                {tipo === 'AJUSTE' ? 'Nuevo stock total' : `Cantidad (${item.unidad})`} *
              </span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              {...register('cantidad', { valueAsNumber: true })}
            />
            <p className="text-xs text-gray-400">{cfg.desc}</p>
            {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad.message}</p>}
          </div>

          {/* Preview stock resultante */}
          {stockPreview !== null && (
            <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium
              ${stockPreview < item.stock_minimo ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
            >
              <span className="text-gray-600">Stock resultante:</span>
              <span className={`text-lg font-bold ${stockPreview < item.stock_minimo ? 'text-red-600' : 'text-green-700'}`}>
                {stockPreview} {item.unidad}
                {stockPreview < item.stock_minimo && <span className="text-xs font-normal ml-1">(bajo mínimo)</span>}
              </span>
            </div>
          )}

          {/* Referencia y nota */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Referencia (opcional)</Label>
              <Input placeholder="Orden de compra, factura proveedor..." {...register('referencia')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nota (opcional)</Label>
              <Input placeholder="Observación sobre el movimiento..." {...register('nota')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={registrar.isPending}>Cancelar</Button>
            <Button type="submit" disabled={registrar.isPending || isSubmitting}>
              {registrar.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
