import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { useQueryClient } from '@tanstack/react-query';
import { ordenFormSchema, type OrdenFormData } from '../../schemas/orden.schema';
import { createOrden, uploadOrdenPDF, updateOrdenPdfUrl } from '../../services/ordenes.service';
import { useAuth } from '../../hooks/useAuth';
import { TASAS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';
import { OrdenPDF } from '../../pdf/OrdenPDF';
import { PageHeader } from '../../components/shared/PageHeader';
import { ClienteCombobox } from '../../components/shared/ClienteCombobox';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import type { Cliente } from '../../types/supabase.types';

const EMPTY_ITEM = (posicion: number): OrdenFormData['items'][number] => ({
  posicion,
  cantidad:    null,
  descripcion: '',
  referencia:  '',
  dureza:      '',
  tarifa_unit: 0,
  subtotal:    0,
});

export default function NuevaOrdenPage() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenFormSchema),
    defaultValues: {
      cliente_id:     '',
      cliente_nombre: '',
      tipo_doc:       'O.S.',
      modo_cobro:     'KG',
      kg_total:       0,
      tarifa_kg:      0,
      valor:          0,
      iva:            0,
      cant_total:     0,
      observacion:    '',
      items:          [1, 2, 3, 4, 5].map(EMPTY_ITEM),
    },
  });

  const { fields } = useFieldArray({ control, name: 'items' });

  // All reactive values via single useWatch
  const [clienteId, modo, tipodoc, kgTotal, tarifaKg, itemsVal, valor, iva] = useWatch({
    control,
    name: ['cliente_id', 'modo_cobro', 'tipo_doc', 'kg_total', 'tarifa_kg', 'items', 'valor', 'iva'],
  });

  const esUnidad = modo === 'UNIDAD';
  const esFE     = tipodoc === 'F.E.';

  // Recalculate totals whenever mode or inputs change
  useEffect(() => {
    let subtotal = 0;

    if (esUnidad) {
      const items = itemsVal ?? [];
      items.forEach((item, i) => {
        const cant   = item.cantidad ?? 0;
        const tarifa = item.tarifa_unit ?? 0;
        const sub    = cant * tarifa;
        setValue(`items.${i}.subtotal`, sub);
        subtotal += sub;
      });
    } else {
      subtotal = (kgTotal ?? 0) * (tarifaKg ?? 0);
    }

    const ivaCalc = esFE ? subtotal * TASAS.IVA : 0;
    setValue('valor', subtotal);
    setValue('iva',   ivaCalc);
  }, [esUnidad, esFE, kgTotal, tarifaKg, itemsVal, setValue]);

  function handleClienteSelect(cliente: Cliente) {
    setValue('cliente_id',     cliente.id);
    setValue('cliente_nombre', cliente.nombre);
    setValue('modo_cobro',     cliente.modo_cobro);
    setValue('tipo_doc',       cliente.tipo_doc);
    setValue('tarifa_kg',      cliente.tarifa_defecto);
  }

  async function onSubmit(data: OrdenFormData) {
    const { data: orden, error } = await createOrden(data, user?.id ?? null);

    if (error || !orden) {
      toast.error(`Error al crear la orden: ${error?.message ?? 'desconocido'}`);
      return;
    }

    toast.success(`Orden TT${orden.no_doc} creada`);

    // Generate and upload PDF (non-blocking — order already saved)
    try {
      const blob   = await pdf(<OrdenPDF orden={orden} items={orden.items} />).toBlob();
      const pdfUrl = await uploadOrdenPDF(blob, orden.no_doc);
      if (pdfUrl) await updateOrdenPdfUrl(orden.id, pdfUrl);
    } catch {
      // Non-critical: order created regardless
    }

    queryClient.invalidateQueries({ queryKey: ['ordenes'] });
    navigate(`/ordenes/${orden.id}`);
  }

  const displayValor = (valor as number) ?? 0;
  const displayIva   = (iva   as number) ?? 0;
  const totalFinal   = displayValor + displayIva;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Nueva Orden de Servicio"
        breadcrumbs={[{ label: 'Órdenes', href: '/ordenes' }, { label: 'Nueva Orden' }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* ── CLIENTE + TIPO DOC ──────────────────── */}
        <Card>
          <CardHeader><CardTitle>Datos del pedido</CardTitle></CardHeader>
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
              <Label>Tipo de documento</Label>
              <Select {...register('tipo_doc')}>
                <option value="O.S.">O.S. — Orden de Servicio</option>
                <option value="F.E.">F.E. — Factura Electrónica</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Modo de cobro</Label>
              <Select {...register('modo_cobro')}>
                <option value="KG">Por KG</option>
                <option value="UNIDAD">Por Unidad</option>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* ── ÍTEMS ──────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Ítems</CardTitle></CardHeader>
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
                    {esUnidad && (
                      <>
                        <th className="pb-2 text-right text-xs font-medium text-gray-500 w-32 pl-2">Tarifa Unit.</th>
                        <th className="pb-2 text-right text-xs font-medium text-gray-500 w-28 pl-2">Subtotal</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, i) => {
                    const items     = (itemsVal as OrdenFormData['items']) ?? [];
                    const itemRow   = items[i];
                    const sub       = (itemRow?.cantidad ?? 0) * (itemRow?.tarifa_unit ?? 0);

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
                            placeholder="Descripción del material..."
                            {...register(`items.${i}.descripcion`)}
                          />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input
                            placeholder="Ref."
                            {...register(`items.${i}.referencia`)}
                          />
                        </td>
                        <td className="py-1.5 pl-2">
                          <Input
                            placeholder="HRC, HB..."
                            {...register(`items.${i}.dureza`)}
                          />
                        </td>
                        {esUnidad && (
                          <>
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
                              {formatCurrency(esUnidad ? sub : 0)}
                            </td>
                          </>
                        )}
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
          <CardHeader><CardTitle>Liquidación</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              {!esUnidad && (
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 w-36">
                    <Label>Total KG</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      {...register('kg_total', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-40">
                    <Label>Tarifa por KG</Label>
                    <Input
                      type="number"
                      step="100"
                      min="0"
                      placeholder="0"
                      {...register('tarifa_kg', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 min-w-[220px]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium tabular-nums">{formatCurrency(displayValor)}</span>
                </div>
                {esFE && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA (19%):</span>
                    <span className="font-medium tabular-nums">{formatCurrency(displayIva)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-800">Total a pagar:</span>
                  <span className="font-bold text-lg text-[#e8734a] tabular-nums">
                    {formatCurrency(totalFinal)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── OBSERVACIONES ──────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Observaciones</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              placeholder="Instrucciones especiales, condiciones de entrega..."
              rows={3}
              {...register('observacion')}
            />
          </CardContent>
        </Card>

        {/* ── ACCIONES ───────────────────────────── */}
        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => navigate('/ordenes')} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear Orden'}
          </Button>
        </div>

      </form>
    </div>
  );
}
