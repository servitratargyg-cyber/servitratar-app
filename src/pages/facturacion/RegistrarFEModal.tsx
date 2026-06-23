import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';
import { registrarFESchema, type RegistrarFEData } from '../../schemas/factura.schema';
import { calcularFactura } from '../../services/facturas.service';
import { useOrdenesParaFacturar, useRegistrarFE, uploadFacturaPDF } from '../../hooks/useFacturas';
import type { Orden } from '../../types/supabase.types';
import { TASAS, UMBRAL_RETENCIONES } from '../../lib/constants';
import { getEmpresaConfig } from '../../services/config.service';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

interface Props {
  open:    boolean;
  onClose: () => void;
}

export function RegistrarFEModal({ open, onClose }: Props) {
  const { data: todasOrdenes = [] } = useOrdenesParaFacturar();
  const registrar   = useRegistrarFE();
  const { prefijo } = getEmpresaConfig();

  const today = new Date().toLocaleDateString('en-CA');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrarFEData>({
    resolver: zodResolver(registrarFESchema),
    defaultValues: {
      orden_ids:   [],
      numero:      '',
      fecha:       today,
      cuenta:      '',
      observacion: '',
    },
  });

  const ordenIds = useWatch({ control, name: 'orden_ids' });
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [pdfFile, setPdfFile]             = useState<File | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  const clientes = useMemo(() => {
    const map = new Map<string, string>();
    todasOrdenes.forEach(o => map.set(o.cliente_id ?? o.cliente_nombre, o.cliente_nombre));
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [todasOrdenes]);

  const ordenesFiltradas = useMemo(() =>
    clienteFiltro
      ? todasOrdenes.filter(o => (o.cliente_id ?? o.cliente_nombre) === clienteFiltro)
      : todasOrdenes,
    [todasOrdenes, clienteFiltro]
  );

  const selectedIds     = (ordenIds as string[]) ?? [];
  const selectedOrdenes: Orden[] = todasOrdenes.filter(o => selectedIds.includes(o.id));
  const calc = selectedOrdenes.length > 0 ? calcularFactura(selectedOrdenes) : null;

  useEffect(() => {
    setValue('orden_ids', []);
  }, [clienteFiltro, setValue]);

  useEffect(() => {
    if (open) {
      reset({ orden_ids: [], numero: '', fecha: today, cuenta: '', observacion: '' });
      setClienteFiltro('');
      setPdfFile(null);
    }
  }, [open, reset, today]);

  function toggleOrden(id: string) {
    const current = (ordenIds as string[]) ?? [];
    setValue(
      'orden_ids',
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  }

  function toggleAll() {
    const current   = (ordenIds as string[]) ?? [];
    const allIds    = ordenesFiltradas.map(o => o.id);
    const allChecked = allIds.every(id => current.includes(id));
    setValue('orden_ids', allChecked ? [] : allIds);
  }

  async function onSubmit(data: RegistrarFEData) {
    let pdfUrl: string | undefined;
    if (pdfFile) {
      pdfUrl = await uploadFacturaPDF(pdfFile, data.numero) ?? undefined;
      if (!pdfUrl) toast.warning('No se pudo subir el PDF, pero la factura se registrará igualmente.');
    }
    const result = await registrar.mutateAsync({ formData: data, ordenes: selectedOrdenes, pdfUrl });
    if (!result.error) onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Registrar Factura Electrónica" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* ── Filtro por cliente ──────────────────── */}
        <div className="flex flex-col gap-1.5">
          <Label>Filtrar por cliente</Label>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8734a]"
            value={clienteFiltro}
            onChange={e => setClienteFiltro(e.target.value)}
          >
            <option value="">— Todos los clientes —</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* ── Lista de órdenes ────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label>
              Órdenes a incluir *{' '}
              <span className="text-gray-400 font-normal">
                ({selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''})
              </span>
            </Label>
            {ordenesFiltradas.length > 1 && (
              <button
                type="button"
                className="text-xs text-[#e8734a] hover:underline"
                onClick={toggleAll}
              >
                {ordenesFiltradas.every(o => selectedIds.includes(o.id))
                  ? 'Deseleccionar todas'
                  : 'Seleccionar todas'}
              </button>
            )}
          </div>

          {todasOrdenes.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-3 text-center">
              No hay órdenes con tipo F.E. pendientes de facturar.
            </p>
          ) : ordenesFiltradas.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-3 text-center">
              Este cliente no tiene órdenes disponibles.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {ordenesFiltradas.map(orden => {
                const checked = selectedIds.includes(orden.id);
                return (
                  <label
                    key={orden.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      checked ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[#e8734a] flex-shrink-0"
                      checked={checked}
                      onChange={() => toggleOrden(orden.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-[#e8734a] text-sm">
                        {prefijo}{orden.no_doc}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">{orden.cliente_nombre}</span>
                      <span className="ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                        {orden.estado}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="tabular-nums text-sm font-medium">
                        {formatCurrency(orden.valor + orden.iva)}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(orden.fecha)}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {errors.orden_ids && (
            <p className="text-xs text-red-500">{errors.orden_ids.message}</p>
          )}
        </div>

        {/* ── Preview de totales ──────────────────── */}
        {calc && selectedOrdenes.length > 0 && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resumen · {selectedOrdenes.length} orden{selectedOrdenes.length !== 1 ? 'es' : ''}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <span className="text-gray-500">Base gravable</span>
              <span className="tabular-nums font-medium text-right">{formatCurrency(calc.base)}</span>

              <span className="text-gray-500">IVA (19%)</span>
              <span className="tabular-nums font-medium text-right">{formatCurrency(calc.iva)}</span>

              <span className="text-gray-500">Total sin retenciones</span>
              <span className="tabular-nums font-medium text-right">{formatCurrency(calc.total_sin_ret)}</span>

              {calc.aplica_ret && (
                <>
                  <span className="text-gray-500">
                    Rete Fuente ({(TASAS.RETE_FUENTE * 100).toFixed(0)}%)
                  </span>
                  <span className="tabular-nums text-red-500 text-right">
                    − {formatCurrency(calc.rete_fuente)}
                  </span>
                  <span className="text-gray-500">
                    Rete ICA ({(TASAS.RETE_ICA * 100).toFixed(3)}%)
                  </span>
                  <span className="tabular-nums text-red-500 text-right">
                    − {formatCurrency(calc.rete_ica)}
                  </span>
                </>
              )}

              <span className="font-semibold text-gray-800 border-t border-gray-200 pt-2">
                Total a cobrar
              </span>
              <span className="tabular-nums font-bold text-[#e8734a] text-right border-t border-gray-200 pt-2">
                {formatCurrency(calc.total)}
              </span>
            </div>

            {/* Indicador automático de retenciones */}
            <div className={`mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs ${
              calc.aplica_ret ? 'text-amber-600' : 'text-gray-400'
            }`}>
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                calc.aplica_ret ? 'bg-amber-500' : 'bg-gray-300'
              }`} />
              {calc.aplica_ret
                ? `Retenciones aplicadas automáticamente (base > ${formatCurrency(UMBRAL_RETENCIONES)})`
                : `Retenciones no aplican (base ≤ ${formatCurrency(UMBRAL_RETENCIONES)})`}
            </div>
          </div>
        )}

        {/* ── Campos de la factura ────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Número de factura *</Label>
            <Input placeholder="FE-001" {...register('numero')} />
            {errors.numero && <p className="text-xs text-red-500">{errors.numero.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fecha de la factura *</Label>
            <Input type="date" {...register('fecha')} />
            {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Cuenta bancaria (opcional)</Label>
            <Input placeholder="Bancolombia 123-456789-00" {...register('cuenta')} />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Observaciones</Label>
            <Textarea placeholder="Notas adicionales..." rows={2} {...register('observacion')} />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>PDF de la factura (opcional)</Label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            />
            {pdfFile ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 text-[#e8734a] flex-shrink-0" />
                <span className="flex-1 truncate text-gray-700">{pdfFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-[#e8734a] hover:text-[#e8734a] transition-colors"
              >
                <Paperclip className="h-4 w-4" />
                Adjuntar PDF de la FE
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={registrar.isPending || isSubmitting || selectedIds.length === 0}
          >
            {registrar.isPending
              ? 'Registrando...'
              : `Registrar FE (${selectedIds.length} OS)`}
          </Button>
        </div>

      </form>
    </Dialog>
  );
}
