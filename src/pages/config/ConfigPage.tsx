import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Users, Lock, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useProfiles, useUpdateProfile, useSaveEmpresaConfig, useCambiarContrasena } from '../../hooks/useConfig';
import { useAuth } from '../../hooks/useAuth';
import { getEmpresaConfig, type EmpresaConfig } from '../../services/config.service';
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
  nombre:    z.string().min(1, 'Requerido'),
  nit:       z.string().min(1, 'Requerido'),
  direccion: z.string().min(1, 'Requerido'),
  tel1:      z.string().min(1, 'Requerido'),
  tel2:      z.string(),
  prefijo:   z.string().min(1, 'Requerido'),
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
  { id: 'empresa',  label: 'Empresa',  icon: Building2 },
  { id: 'usuarios', label: 'Usuarios', icon: Users     },
  { id: 'seguridad',label: 'Seguridad',icon: Lock      },
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

      {activeTab === 'empresa'   && <TabEmpresa />}
      {activeTab === 'usuarios'  && <TabUsuarios />}
      {activeTab === 'seguridad' && <TabSeguridad />}
    </div>
  );
}
