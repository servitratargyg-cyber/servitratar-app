import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Users, Lock, ToggleLeft, ToggleRight, Info, Tags, Trash2, Plus, RotateCcw } from 'lucide-react';
import { useProfiles, useUpdateProfile, useSaveEmpresaConfig, useCambiarContrasena } from '../../hooks/useConfig';
import { useAuth } from '../../hooks/useAuth';
import { getEmpresaConfig, type EmpresaConfig, getCategoriasItem, saveCategoriasItem, CATEGORIAS_DEFAULT } from '../../services/config.service';
import type { Profile } from '../../types/supabase.types';
import { formatDate } from '../../lib/formatters';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';

// ── Schemas ───────────────────────────────────────────────
const empresaSchema = z.object({
  nombre:             z.string().min(1, 'Requerido'),
  nit:                z.string().min(1, 'Requerido'),
  direccion:          z.string().min(1, 'Requerido'),
  tel1:               z.string().min(1, 'Requerido'),
  tel2:               z.string(),
  prefijo:            z.string().min(1, 'Requerido'),
  valor_minimo_orden: z.number({ message: 'Requerido' }).min(0, 'Debe ser ≥ 0'),
});
type EmpresaFormData = z.infer<typeof empresaSchema>;

const passwordSchema = z.object({
  nueva:    z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string().min(6),
}).refine(d => d.nueva === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmar'],
});
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Tabs ──────────────────────────────────────────────────
const TABS = [
  { id: 'empresa',    label: 'Empresa',    icon: Building2 },
  { id: 'categorias', label: 'Categorías', icon: Tags      },
  { id: 'usuarios',   label: 'Usuarios',   icon: Users     },
  { id: 'seguridad',  label: 'Seguridad',  icon: Lock      },
] as const;
type TabId = typeof TABS[number]['id'];

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin:    'Administrador',
  operario: 'Operario',
  contador: 'Contador',
};

const ROLE_COLOR: Record<Profile['role'], string> = {
  admin:    'bg-[#1a1a2e] text-white',
  operario: 'bg-blue-100 text-blue-700',
  contador: 'bg-purple-100 text-purple-700',
};

// ── Tab Empresa ───────────────────────────────────────────
function TabEmpresa() {
  const current = getEmpresaConfig();
  const save    = useSaveEmpresaConfig();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<EmpresaFormData>({
    resolver:      zodResolver(empresaSchema),
    defaultValues: current,
  });

  function onSubmit(data: EmpresaFormData) {
    save.mutate(data as EmpresaConfig);
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Estos datos aparecen en los PDFs de órdenes, cotizaciones y comprobantes. Los cambios se aplican al recargar la página.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Datos de la empresa</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Nombre / Razón social *</Label>
                <Input placeholder="SERVITRATAR G&G S.A.S." {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>NIT *</Label>
                <Input placeholder="901.906.990-4" {...register('nit')} />
                {errors.nit && <p className="text-xs text-red-500">{errors.nit.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Prefijo de OS *</Label>
                <Input placeholder="TT" {...register('prefijo')} className="uppercase" />
                {errors.prefijo && <p className="text-xs text-red-500">{errors.prefijo.message}</p>}
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Dirección *</Label>
                <Input placeholder="Cra 69B No. 31-18 Sur — Carvajal, Bogotá D.C." {...register('direccion')} />
                {errors.direccion && <p className="text-xs text-red-500">{errors.direccion.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Teléfono 1 *</Label>
                <Input placeholder="312 426 5187" {...register('tel1')} />
                {errors.tel1 && <p className="text-xs text-red-500">{errors.tel1.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Teléfono 2</Label>
                <Input placeholder="310 850 1926" {...register('tel2')} />
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reglas de negocio</p>
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <Label>Valor mínimo por Orden de Servicio *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      className="pl-7"
                      placeholder="5000"
                      {...register('valor_minimo_orden', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.valor_minimo_orden && (
                    <p className="text-xs text-red-500">{errors.valor_minimo_orden.message}</p>
                  )}
                  <p className="text-xs text-gray-400">Se aplica automáticamente al calcular el subtotal de cada ítem.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button type="submit" disabled={save.isPending || !isDirty}>
                {save.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab Categorías ────────────────────────────────────────
function TabCategorias() {
  const [categorias, setCategorias] = useState<string[]>(() => getCategoriasItem());
  const [nueva, setNueva]           = useState('');
  const [saved, setSaved]           = useState(false);

  function agregar() {
    const trimmed = nueva.trim();
    if (!trimmed || categorias.includes(trimmed)) return;
    setCategorias(prev => [...prev, trimmed]);
    setNueva('');
    setSaved(false);
  }

  function eliminar(cat: string) {
    setCategorias(prev => prev.filter(c => c !== cat));
    setSaved(false);
  }

  function guardar() {
    saveCategoriasItem(categorias);
    setSaved(true);
  }

  function restaurar() {
    setCategorias([...CATEGORIAS_DEFAULT]);
    setSaved(false);
  }

  return (
    <div className="max-w-lg flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Las categorías se usan para clasificar los ítems en órdenes y aparecen en los reportes de ventas. Los cambios se aplican inmediatamente al crear nuevas órdenes.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categorías de ítem</CardTitle>
            <button
              type="button"
              onClick={restaurar}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="Restaurar valores por defecto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Lista actual */}
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {categorias.length === 0 && (
              <p className="text-sm text-gray-400">Sin categorías definidas.</p>
            )}
            {categorias.map(cat => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => eliminar(cat)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title={`Eliminar "${cat}"`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Agregar nueva */}
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <Input
              placeholder="Nueva categoría..."
              value={nueva}
              onChange={e => { setNueva(e.target.value); setSaved(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={agregar} disabled={!nueva.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>

          {/* Guardar */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            {saved && <p className="text-xs text-green-600">Cambios guardados correctamente.</p>}
            {!saved && <span />}
            <Button type="button" onClick={guardar} disabled={saved}>
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab Usuarios ──────────────────────────────────────────
function TabUsuarios() {
  const { data: profiles = [], isLoading } = useProfiles();
  const { user } = useAuth();
  const update   = useUpdateProfile();

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Para crear nuevos usuarios invítalos desde el <strong>panel de Supabase → Authentication → Users → Invite</strong>. El perfil se crea automáticamente al primer inicio de sesión.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-400 py-6 text-center">Cargando...</p>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay usuarios registrados</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {profiles.map(profile => {
                const esSelf = profile.id === user?.id;
                return (
                  <div key={profile.id} className="flex flex-wrap items-center gap-4 py-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-[140px]">
                      <p className="font-medium text-gray-800 text-sm">
                        {profile.full_name}
                        {esSelf && <span className="ml-2 text-xs text-gray-400">(tú)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(profile.created_at)}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[profile.role]}`}>
                      {ROLE_LABEL[profile.role]}
                    </span>

                    {/* Controles (no se puede editar a sí mismo en rol/activo) */}
                    {!esSelf && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={profile.role}
                          onChange={e => update.mutate({
                            id: profile.id,
                            values: { role: e.target.value as Profile['role'] },
                          })}
                          className="text-xs h-8 py-0"
                        >
                          <option value="admin">Administrador</option>
                          <option value="operario">Operario</option>
                          <option value="contador">Contador</option>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          title={profile.is_active ? 'Desactivar acceso' : 'Activar acceso'}
                          onClick={() => update.mutate({
                            id: profile.id,
                            values: { is_active: !profile.is_active },
                          })}
                        >
                          {profile.is_active
                            ? <ToggleRight className="h-5 w-5 text-green-600" />
                            : <ToggleLeft  className="h-5 w-5 text-gray-400"  />}
                        </Button>
                      </div>
                    )}

                    {!profile.is_active && !esSelf && (
                      <span className="text-xs text-red-500 font-medium">Desactivado</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab Seguridad ─────────────────────────────────────────
function TabSeguridad() {
  const cambiar = useCambiarContrasena();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { nueva: '', confirmar: '' },
  });

  async function onSubmit(data: PasswordFormData) {
    const result = await cambiar.mutateAsync(data.nueva);
    if (!result.error) reset();
  }

  return (
    <div className="max-w-md flex flex-col gap-5">
      <Card>
        <CardHeader><CardTitle>Cambiar contraseña</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nueva contraseña *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                {...register('nueva')}
              />
              {errors.nueva && <p className="text-xs text-red-500">{errors.nueva.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Confirmar contraseña *</Label>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                {...register('confirmar')}
              />
              {errors.confirmar && <p className="text-xs text-red-500">{errors.confirmar.message}</p>}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button type="submit" disabled={cambiar.isPending}>
                {cambiar.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── ConfigPage ────────────────────────────────────────────
export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabId>('empresa');

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema"
        breadcrumbs={[{ label: 'Configuración' }]}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-[#e8734a] text-[#e8734a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'empresa'    && <TabEmpresa />}
      {activeTab === 'categorias' && <TabCategorias />}
      {activeTab === 'usuarios'   && <TabUsuarios />}
      {activeTab === 'seguridad'  && <TabSeguridad />}
    </div>
  );
}
