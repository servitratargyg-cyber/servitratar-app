import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Trash2, Plus, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { NominaPDF } from '../../pdf/NominaPDF';
import { nominaFormSchema, type NominaFormData } from '../../schemas/nomina.schema';
import { calcularNomina } from '../../services/nomina.service';
import { useNominas, useCreateNomina, useMarcarNominaPagada, useDeleteNomina } from '../../hooks/useNomina';
import { useEmpleados } from '../../hooks/useEmpleados';
import type { NominaConEmpleado } from '../../services/nomina.service';
import { formatCurrency, formatDate, getMesNombre } from '../../lib/formatters';
import { AUX_TRANSPORTE_2026, ARL_TASAS } from '../../lib/constants';
import { PageHeader } from '../../components/shared/PageHeader';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { StatusBadge } from '../../components/shared/StatusBadge';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

// ── LiquidarModal ─────────────────────────────────────────
interface LiquidarModalProps {
  open:    boolean;
  onClose: () => void;
}

function LiquidarModal({ open, onClose }: LiquidarModalProps) {
  const { data: empleados = [] } = useEmpleados(true);
  const create = useCreateNomina();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<NominaFormData>({
    resolver:      zodResolver(nominaFormSchema),
    defaultValues: {
      empleado_id:       '',
      periodo_mes:       CURRENT_MONTH,
      periodo_anio:      CURRENT_YEAR,
      dias_trabajados:   30,
      horas_extras:      0,
      otros_ingresos:    0,
      retencion_fte:     0,
      otras_deducciones: 0,
      arl_tasa:          0.00522,
      observacion:       '',
    },
  });

  const [empId, dias, hextras, otrosIng, retFte, otrasDedu, arlTasa] = useWatch({
    control,
    name: ['empleado_id', 'dias_trabajados', 'horas_extras', 'otros_ingresos', 'retencion_fte', 'otras_deducciones', 'arl_tasa'],
  });

  const empleado = useMemo(
    () => empleados.find(e => e.id === empId) ?? null,
    [empleados, empId]
  );

  useEffect(() => {
    if (!empleado) return;
    const tasa = ARL_TASAS[empleado.nivel_riesgo ?? 1];
    setValue('arl_tasa', tasa);
  }, [empleado, setValue]);

  const calculo = useMemo(() => {
    if (!empleado) return null;
    return calcularNomina(empleado, {
      empleado_id:       empId as string,
      periodo_mes:       CURRENT_MONTH,
      periodo_anio:      CURRENT_YEAR,
      dias_trabajados:   Number(dias)      || 30,
      horas_extras:      Number(hextras)   || 0,
      otros_ingresos:    Number(otrosIng)  || 0,
      retencion_fte:     Number(retFte)    || 0,
      otras_deducciones: Number(otrasDedu) || 0,
      arl_tasa:          Number(arlTasa)   || 0.00522,
      observacion:       '',
    });
  }, [empleado, empId, dias, hextras, otrosIng, retFte, otrasDedu, arlTasa]);

  async function onSubmit(data: NominaFormData) {
    if (!empleado) return;
    await create.mutateAsync({ empleado, form: data });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Liquidar nómina" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Empleado + período */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 flex flex-col gap-1.5">
            <Label>Empleado *</Label>
            <Select {...register('empleado_id')}>
              <option value="">Seleccionar empleado...</option>
              {empleados.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.apellido} — {formatCurrency(e.salario_base)}
                </option>
              ))}
            </Select>
            {errors.empleado_id && <p className="text-xs text-red-500">{errors.empleado_id.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mes *</Label>
            <Select {...register('periodo_mes', { valueAsNumber: true })}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{getMesNombre(m)}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Año *</Label>
            <Select {...register('periodo_anio', { valueAsNumber: true })}>
              {[CURRENT_YEAR, CURRENT_YEAR - 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Días trabajados</Label>
            <Input type="number" min="0" max="30" {...register('dias_trabajados', { valueAsNumber: true })} />
          </div>
        </div>

        {/* Ingresos adicionales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Horas extras ($)</Label>
            <Input type="number" min="0" step="1000" placeholder="0" {...register('horas_extras', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Otros ingresos ($)</Label>
            <Input type="number" min="0" step="1000" placeholder="0" {...register('otros_ingresos', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retención en la fuente ($)</Label>
            <Input type="number" min="0" step="1000" placeholder="0" {...register('retencion_fte', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Otras deducciones ($)</Label>
            <Input type="number" min="0" step="1000" placeholder="0" {...register('otras_deducciones', { valueAsNumber: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tasa ARL</Label>
            <Input
              type="number"
              min="0"
              step="0.00001"
              {...register('arl_tasa', { valueAsNumber: true })}
              readOnly={!!empleado?.nivel_riesgo}
              className={empleado?.nivel_riesgo ? 'bg-gray-50 text-gray-500 cursor-default' : ''}
            />
            <p className="text-[10px] text-gray-400">
              {empleado?.nivel_riesgo
                ? `Clase ${empleado.nivel_riesgo} — tomada del perfil del empleado (${(ARL_TASAS[empleado.nivel_riesgo] * 100).toFixed(3)}%)`
                : 'Selecciona un empleado para autocompletar según su nivel de riesgo ARL'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Observación</Label>
            <Input placeholder="Opcional..." {...register('observacion')} />
          </div>
        </div>

        {/* Resumen calculado */}
        {calculo && empleado && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-700 mb-3">Resumen — {empleado.nombre} {empleado.apellido}</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              {/* Devengado */}
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-1">Devengado</div>
              <Row label="Salario proporcional" value={calculo.neto_pagar + calculo.total_deducciones - calculo.aux_transporte - calculo.horas_extras - calculo.otros_ingresos} />
              {calculo.aux_transporte > 0 && <Row label={`Auxilio transp. (${AUX_TRANSPORTE_2026.toLocaleString()})`} value={calculo.aux_transporte} />}
              {calculo.horas_extras > 0 && <Row label="Horas extras" value={calculo.horas_extras} />}
              {calculo.otros_ingresos > 0 && <Row label="Otros ingresos" value={calculo.otros_ingresos} />}
              <Row label="Total devengado" value={calculo.total_devengado} bold />

              {/* Deducciones */}
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-2">Deducciones empleado</div>
              <Row label="Salud (4%)" value={-calculo.salud_empleado} red />
              <Row label="Pensión (4%)" value={-calculo.pension_empleado} red />
              {calculo.retencion_fte > 0 && <Row label="Retención en la fuente" value={-calculo.retencion_fte} red />}
              {calculo.otras_deducciones > 0 && <Row label="Otras deducciones" value={-calculo.otras_deducciones} red />}
              <Row label="Total deducciones" value={-calculo.total_deducciones} bold red />

              {/* Neto */}
              <div className="col-span-2 border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                <span>Neto a pagar</span>
                <span className="text-[#e8734a]">{formatCurrency(calculo.neto_pagar)}</span>
              </div>

              {/* Aportes empleador */}
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-3">Aportes empleador (costo empresa)</div>
              <Row label="Salud (8.5%)" value={calculo.salud_empleador} />
              <Row label="Pensión (12%)" value={calculo.pension_empleador} />
              <Row label="ARL" value={calculo.arl} />
              <Row label="Caja (4%)" value={calculo.caja} />
              <Row label="SENA (2%)" value={calculo.sena} />
              <Row label="ICBF (3%)" value={calculo.icbf} />

              {/* Prestaciones */}
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase mt-2">Prestaciones sociales</div>
              <Row label="Cesantías (8.33%)" value={calculo.cesantias} />
              <Row label="Int. cesantías (1%)" value={calculo.intereses_ces} />
              <Row label="Prima (8.33%)" value={calculo.prima} />
              <Row label="Vacaciones (4.17%)" value={calculo.vacaciones} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending || !empleado}>
            {create.isPending ? 'Guardando...' : 'Liquidar nómina'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Row({ label, value, bold, red }: { label: string; value: number; bold?: boolean; red?: boolean }) {
  return (
    <>
      <span className={bold ? 'font-semibold' : 'text-gray-600'}>{label}</span>
      <span className={`text-right tabular-nums ${bold ? 'font-semibold' : ''} ${red ? 'text-red-600' : 'text-gray-800'}`}>
        {formatCurrency(value)}
      </span>
    </>
  );
}

// ── PagarModal ────────────────────────────────────────────
interface PagarModalProps {
  nomina: NominaConEmpleado | null;
  onClose: () => void;
}

function PagarModal({ nomina, onClose }: PagarModalProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const pagar = useMarcarNominaPagada();

  async function confirmar() {
    if (!nomina) return;
    await pagar.mutateAsync({ id: nomina.id, fecha_pago: fecha });
    onClose();
  }

  return (
    <Dialog open={!!nomina} onClose={onClose} title="Registrar pago de nómina" className="max-w-sm">
      {nomina && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
            <p className="font-semibold">{nomina.empleado.nombre} {nomina.empleado.apellido}</p>
            <p className="text-gray-500">{getMesNombre(nomina.periodo_mes)} {nomina.periodo_anio}</p>
            <p className="text-[#e8734a] font-bold text-lg mt-1">{formatCurrency(nomina.neto_pagar)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de pago</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <Button variant="outline" onClick={onClose} disabled={pagar.isPending}>Cancelar</Button>
            <Button onClick={confirmar} disabled={pagar.isPending}>
              {pagar.isPending ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

async function descargarNominaPDF(nomina: NominaConEmpleado) {
  const blob = await pdf(<NominaPDF nomina={nomina} />).toBlob();
  const nombre = `Nomina_${nomina.empleado.apellido}_${getMesNombre(nomina.periodo_mes)}_${nomina.periodo_anio}.pdf`;
  saveAs(blob, nombre);
}

// ── NominaPage ────────────────────────────────────────────
export default function NominaPage() {
  const [mes,          setMes]          = useState(CURRENT_MONTH);
  const [anio,         setAnio]         = useState(CURRENT_YEAR);
  const [liquidarOpen, setLiquidarOpen] = useState(false);
  const [pagarTarget,  setPagarTarget]  = useState<NominaConEmpleado | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NominaConEmpleado | null>(null);

  const { data: nominas = [], isLoading } = useNominas(mes, anio);
  const eliminar = useDeleteNomina();

  const totalNeto       = nominas.reduce((s, n) => s + n.neto_pagar, 0);
  const totalDevengado  = nominas.reduce((s, n) => s + n.total_devengado, 0);
  const pagadas         = nominas.filter(n => n.estado === 'PAGADA').length;

  return (
    <div>
      <PageHeader
        title="Nómina"
        description={`${getMesNombre(mes)} ${anio} · ${nominas.length} empleado${nominas.length !== 1 ? 's' : ''} liquidado${nominas.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Nómina' }]}
        action={
          <Button onClick={() => setLiquidarOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Liquidar nómina
          </Button>
        }
      />

      {/* Selector de período */}
      <div className="flex items-center gap-3 mb-5">
        <Select
          value={mes}
          onChange={e => setMes(Number(e.target.value))}
          className="w-36"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{getMesNombre(m)}</option>
          ))}
        </Select>
        <Select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="w-28"
        >
          {[CURRENT_YEAR, CURRENT_YEAR - 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>

      {/* KPIs */}
      {nominas.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
          {[
            { label: 'Total devengado',  value: formatCurrency(totalDevengado), color: 'text-gray-800' },
            { label: 'Total neto pagar', value: formatCurrency(totalNeto),      color: 'text-[#e8734a]' },
            { label: 'Liquidados',       value: nominas.length.toString(),      color: 'text-gray-800' },
            { label: 'Pagados',          value: `${pagadas} / ${nominas.length}`, color: 'text-green-600' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla de nóminas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Cargando...</div>
      ) : nominas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          <p className="font-medium">No hay nóminas para este período</p>
          <p className="text-sm mt-1">Haz clic en "Liquidar nómina" para comenzar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {nominas.map(nomina => (
            <Card key={nomina.id}>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Empleado */}
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-semibold text-gray-800">
                      {nomina.empleado.nombre} {nomina.empleado.apellido}
                    </p>
                    <p className="text-xs text-gray-400">{nomina.empleado.cargo ?? 'Sin cargo'} · CC {nomina.empleado.cedula}</p>
                  </div>

                  {/* Resumen financiero */}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Devengado</p>
                      <p className="tabular-nums font-medium">{formatCurrency(nomina.total_devengado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Deducciones</p>
                      <p className="tabular-nums font-medium text-red-600">− {formatCurrency(nomina.total_deducciones)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Neto</p>
                      <p className="tabular-nums font-bold text-[#e8734a]">{formatCurrency(nomina.neto_pagar)}</p>
                    </div>
                  </div>

                  {/* Estado + acciones */}
                  <div className="flex items-center gap-3 ml-auto">
                    <StatusBadge estado={nomina.estado} />
                    {nomina.estado === 'PAGADA' && nomina.fecha_pago && (
                      <span className="text-xs text-gray-400">{formatDate(nomina.fecha_pago)}</span>
                    )}
                    {nomina.estado === 'BORRADOR' && (
                      <Button
                        size="sm"
                        onClick={() => setPagarTarget(nomina)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Marcar pagada
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Descargar PDF"
                      onClick={() => descargarNominaPDF(nomina)}
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      onClick={() => setDeleteTarget(nomina)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Detalle expandido */}
                <details className="mt-3">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    Ver desglose completo
                  </summary>
                  <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1 text-xs border-t border-gray-100 pt-3">
                    <DetalleGroup title="Devengado">
                      <DetalleRow label="Días trabajados" value={`${nomina.dias_trabajados} días`} currency={false} />
                      <DetalleRow label="Salario base" value={nomina.salario_base} />
                      {nomina.aux_transporte > 0 && <DetalleRow label="Aux. transporte" value={nomina.aux_transporte} />}
                      {nomina.horas_extras > 0 && <DetalleRow label="Horas extras" value={nomina.horas_extras} />}
                      {nomina.otros_ingresos > 0 && <DetalleRow label="Otros ingresos" value={nomina.otros_ingresos} />}
                    </DetalleGroup>
                    <DetalleGroup title="Deducciones empleado">
                      <DetalleRow label="Salud" value={nomina.salud_empleado} />
                      <DetalleRow label="Pensión" value={nomina.pension_empleado} />
                      {nomina.retencion_fte > 0 && <DetalleRow label="Ret. fuente" value={nomina.retencion_fte} />}
                      {nomina.otras_deducciones > 0 && <DetalleRow label="Otras" value={nomina.otras_deducciones} />}
                    </DetalleGroup>
                    <DetalleGroup title="Aportes empleador">
                      <DetalleRow label="Salud" value={nomina.salud_empleador} />
                      <DetalleRow label="Pensión" value={nomina.pension_empleador} />
                      <DetalleRow label="ARL" value={nomina.arl} />
                      <DetalleRow label="Caja" value={nomina.caja} />
                      <DetalleRow label="SENA" value={nomina.sena} />
                      <DetalleRow label="ICBF" value={nomina.icbf} />
                      <DetalleRow label="Cesantías" value={nomina.cesantias} />
                      <DetalleRow label="Int. ces." value={nomina.intereses_ces} />
                      <DetalleRow label="Prima" value={nomina.prima} />
                      <DetalleRow label="Vacaciones" value={nomina.vacaciones} />
                    </DetalleGroup>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LiquidarModal open={liquidarOpen} onClose={() => setLiquidarOpen(false)} />
      <PagarModal nomina={pagarTarget} onClose={() => setPagarTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="¿Eliminar registro?"
        description={`Se eliminará la nómina de ${deleteTarget?.empleado.nombre} ${deleteTarget?.empleado.apellido} para ${deleteTarget ? getMesNombre(deleteTarget.periodo_mes) : ''} ${deleteTarget?.periodo_anio ?? ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) eliminar.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DetalleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px] mb-1">{title}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DetalleRow({ label, value, currency = true }: { label: string; value: number | string; currency?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="tabular-nums text-gray-700">
        {currency ? formatCurrency(value as number) : value}
      </span>
    </div>
  );
}
