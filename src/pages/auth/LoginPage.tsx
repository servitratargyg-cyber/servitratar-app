import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { EMPRESA } from '../../lib/constants';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-[#1a1a2e] flex-col items-center justify-center p-12">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          <img src="/logo.png" alt="Servitratar" className="h-32 w-32 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {EMPRESA.nombre}
            </h1>
            <p className="text-white/50 mt-2 text-sm">
              Sistema de Gestión Empresarial
            </p>
          </div>
          <div className="border-t border-white/10 pt-6 w-full">
            <p className="text-xs text-white/30 leading-relaxed">
              {EMPRESA.direccion}
              <br />
              {EMPRESA.tel1} / {EMPRESA.tel2}
              <br />
              NIT: {EMPRESA.nit}
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#f0f4f8]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Servitratar" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-[#1a1a2e]">SERVITRATAR</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-8">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@servitratar.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
