import { useAuthContext } from '../store/auth.context';

export function useAuth() {
  return useAuthContext();
}

export function usePermissions() {
  const { profile } = useAuthContext();
  const role = profile?.role ?? null;

  return {
    role,
    isAdmin:    role === 'admin',
    isOperario: role === 'operario',
    isContador: role === 'contador',
    can: {
      crearOrdenes:  role === 'admin' || role === 'operario',
      editarOrdenes: role === 'admin' || role === 'operario',
      facturacion:   role === 'admin' || role === 'contador',
      cartera:       role === 'admin' || role === 'contador',
      empleados:     role === 'admin' || role === 'contador',
      nomina:        role === 'admin' || role === 'contador',
      reportes:      role === 'admin' || role === 'contador',
      inventario:    role === 'admin' || role === 'operario',
      cotizaciones:  role === 'admin' || role === 'operario',
      configuracion: role === 'admin',
    },
  };
}
