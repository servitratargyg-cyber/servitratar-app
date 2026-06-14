import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { PageLoader } from '../components/shared/LoadingSpinner';

const LoginPage         = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage     = lazy(() => import('../pages/dashboard/DashboardPage'));
const OrdenesPage       = lazy(() => import('../pages/ordenes/OrdenesPage'));
const ClientesPage      = lazy(() => import('../pages/clientes/ClientesPage'));
const FacturacionPage   = lazy(() => import('../pages/facturacion/FacturacionPage'));
const CarteraPage       = lazy(() => import('../pages/cartera/CarteraPage'));
const CotizacionesPage  = lazy(() => import('../pages/cotizaciones/CotizacionesPage'));
const InventarioPage    = lazy(() => import('../pages/inventario/InventarioPage'));
const EmpleadosPage     = lazy(() => import('../pages/empleados/EmpleadosPage'));
const NominaPage        = lazy(() => import('../pages/empleados/NominaPage'));
const ReportesPage      = lazy(() => import('../pages/reportes/ReportesPage'));

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleGuard({ allowed }: { allowed: boolean }) {
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path:    '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index:   true,
            element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
          },
          {
            path:    'ordenes',
            element: <SuspenseWrapper><OrdenesPage /></SuspenseWrapper>,
          },
          {
            path:    'clientes',
            element: <SuspenseWrapper><ClientesPage /></SuspenseWrapper>,
          },
          {
            element:  <RoleGuardCotizaciones />,
            children: [
              {
                path:    'cotizaciones',
                element: <SuspenseWrapper><CotizacionesPage /></SuspenseWrapper>,
              },
            ],
          },
          {
            element:  <RoleGuardFacturacion />,
            children: [
              {
                path:    'facturacion',
                element: <SuspenseWrapper><FacturacionPage /></SuspenseWrapper>,
              },
              {
                path:    'cartera',
                element: <SuspenseWrapper><CarteraPage /></SuspenseWrapper>,
              },
            ],
          },
          {
            element:  <RoleGuardInventario />,
            children: [
              {
                path:    'inventario',
                element: <SuspenseWrapper><InventarioPage /></SuspenseWrapper>,
              },
            ],
          },
          {
            element:  <RoleGuardNomina />,
            children: [
              {
                path:    'empleados',
                element: <SuspenseWrapper><EmpleadosPage /></SuspenseWrapper>,
              },
              {
                path:    'nomina',
                element: <SuspenseWrapper><NominaPage /></SuspenseWrapper>,
              },
              {
                path:    'reportes',
                element: <SuspenseWrapper><ReportesPage /></SuspenseWrapper>,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path:    '*',
    element: <Navigate to="/" replace />,
  },
]);

function RoleGuardCotizaciones() {
  const { can } = usePermissions();
  return <RoleGuard allowed={can.cotizaciones} />;
}

function RoleGuardFacturacion() {
  const { can } = usePermissions();
  return <RoleGuard allowed={can.facturacion} />;
}

function RoleGuardInventario() {
  const { can } = usePermissions();
  return <RoleGuard allowed={can.inventario} />;
}

function RoleGuardNomina() {
  const { can } = usePermissions();
  return <RoleGuard allowed={can.nomina} />;
}
