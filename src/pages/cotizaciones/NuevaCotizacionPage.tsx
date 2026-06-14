import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pdf } from '@react-pdf/renderer';
import { Plus, Trash2 } from 'lucide-react';
import { cotizacionFormSchema, type CotizacionFormData } from '../../schemas/cotizacion.schema';
import { useCreateCotizacion } from '../../hooks/useCotizaciones';
import { useAuth } from '../../hooks/useAuth';
import { TASAS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';
import { CotizacionPDF } from '../../pdf/CotizacionPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { ClienteCombobox } from '../../components/shared/ClienteCombobox';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import type { Cliente } from '../../types/supabase.types';

const EMPTY_ITEM = (posicion: number): CotizacionFormData['items'][number] => ({
  posicion,
  cantidad:    null,
  descripcion: '',
  referencia:  '',
  dureza:      '',
  tarifa_unit: 0,
  subtotal:    0,
});

function getDefaultFechaValidez(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default function NuevaCotizacionPage() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const create      = useCreateCotizacion(user?.id ?? null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CotizacionFormData>({
    resolver: zodResolver(cotizacionFormSchema),
    defaultValues: {
      cliente_id:     '',
      cliente_nombre: '',
      modo_cobro:     'KG',
      fecha_validez:  getDefaultFechaValidez(),
      incluir_iva:    false,
      subtotal:       0,
      iva:            0,
      total:          0,
      notas:          '',
      items:          [1, 2, 3, 4, 5].map(EMPTY_ITEM),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const [clienteId, modo, itemsVal, incluirIva, subtotal, iva] = useWatch({
    control,
    name: ['cliente_id', 'modo_cobro', 'items', 'incluir_iva', 'subtotal', 'iva'],
  });

  const esUnidad = modo === 'UNIDAD';

  useEffect(() => {
    const items = (itemsVal as CotizacionFormData['items']) ?? [];
    let sub = 0;
    items.forEach((item, i) => {
      const cant   = item.cantidad ?? 0;
      const tarifa = item.tarifa_unit ?? 0;
      const s      = cant * tarifa;
      setValue(`items.${i}.subtotal`, s);
      sub += s;
    });
    const ivaCalc = incluirIva ? sub * TASAS.IVA : 0;
    setValue('subtotal', sub);
    setValue('iva',      ivaCalc);
    setValue('total',    sub + ivaCalc);
  }, [itemsVal, incluirIva, setValue]);

  function handleClienteSelect(cliente: Cliente) {
    setValue('cliente_id',     cliente.id);
    setValue('cliente_nombre', cliente.nombre);
    setValue('modo_cobro',     cliente.modo_cobro);
  }

  async function onSubmit(data: CotizacionFormData) {
    const result = await create.mutateAsync(data);
    if (!result?.data) return;

    // Generate PDF non-blocking
    try {
      const blob = await pdf(
        <CotizacionPDF cotizacion={result.data} items={result.data.items} />
      ).toBlob();
      // Future: upload to storage if needed
      void blob;
    } catch { /* non-critical */ }

    navigate(`/cotizaciones/${result.data.id}`);
  }

  const displaySub = (subtotal as number) ?? 0;
  const displayIva = (iva     as number) ?? 0;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nueva Cotización"
        breadcrumbs={[
          { label: 'Cotizaciones', href: '/cotizaciones' },
          { label: 'Nueva Cotización' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* ── CLIENTE ─────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Datos de la cotización</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label>Cliente *</Label>
              <ClienteCombobox
                value={clienteId as string}
                onChange={handleClienteSelect}
                onClear={() => { setValue('cliente_id', ''); setValue('cliente_nombre', ''); }}
                error={errors.cliente_id?.message}
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
              <Label>Válida hasta *</Label>
              <Input
                type="date"
                {...register('fecha_validez')}
              />
              {errors.fecha_validez && (
                <p className="text-xs text-red-500">{errors.fecha_validez.message}</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ── ÍTEMS ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ítems cotizados</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(EMPTY_ITEM(fields.length + 1))}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar fila
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left text-xs font-medium text-gray-500 w-6">#</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-500 w-24 pl-2">Cantidad</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-500 pl-2">Descripción</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-500 w-32 pl-2">Referencia</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-500 w-28 pl-2">Dureza</th>
                    <th className="pb-2 text-right text-xs font-medium text-gray-500 w-32 pl-2">
                      Tarifa ({esUnidad ? 'und' : 'kg'})
                    </th>
                    <th className="pb-2 text-right text-xs font-medium text-gray-500 w-28 pl-2">Subtotal</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => {
                    const items   = (itemsVal as CotizacionFormData['items']) ?? [];
                    const itemRow = items[i];
                    const sub     = (itemRow?.cantidad ?? 0) * (itemRow?.tarifa_unit ?? 0);

                    return (
                      <tr key={field.id}>
                        <td className="py-1.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-1.5 pl-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            {...register(`items.${i}.cantidad`, {
                              setValueAs: v => v === '' ? null : Number(v),
                            })}
                          />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input
                            placeholder="Descripción del servicio..."
                            {...register(`items.${i}.descripcion`)}
                          />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input placeholder="Ref." {...register(`items.${i}.referencia`)} />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input placeholder="HRC, HB..." {...register(`items.${i}.dureza`)} />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input
                            type="number"
                            step="100"
                            min="0"
                            placeholder="0"
                            className="text-right"
                            {...register(`items.${i}.tarifa_unit`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="py-1.5 pl-2 text-right tabular-nums text-gray-700 font-medium text-sm">
                          {formatCurrency(sub)}
                        </td>
                        <td className="py-1.5 pl-1">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(i)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── TOTALES ────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#e8734a]"
                  {...register('incluir_iva')}
                />
                <span className="text-sm text-gray-700">Incluir IVA (19%)</span>
              </label>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium tabular-nums">{formatCurrency(displaySub)}</span>
                </div>
                {(incluirIva as boolean) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA (19%):</span>
                    <span className="font-medium tabular-nums">{formatCurrency(displayIva)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-800">Total cotizado:</span>
                  <span className="font-bold text-lg text-[#e8734a] tabular-nums">
                    {formatCurrency(displaySub + displayIva)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── NOTAS ──────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Notas y condiciones</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Condiciones de pago, tiempos de entrega, observaciones..."
              rows={3}
              {...register('notas')}
            />
          </CardContent>
        </Card>

        {/* ── ACCIONES ───────────────────────────── */}
        <div className="flex justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/cotizaciones')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || create.isPending}>
            {isSubmitting || create.isPending ? 'Guardando...' : 'Crear Cotización'}
          </Button>
        </div>

      </form>
    </div>
  );
}
