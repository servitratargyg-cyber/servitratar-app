import { lazy, Suspense, type ReactNode } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { PageLoader } from '../components/shared/LoadingSpinner';

// Pages — auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Pages — core
const DashboardPage           = lazy(() => import('../pages/dashboard/DashboardPage'));
const OrdenesPage             = lazy(() => import('../pages/ordenes/OrdenesPage'));
const NuevaOrdenPage          = lazy(() => import('../pages/ordenes/NuevaOrdenPage'));
const OrdenDetallePage        = lazy(() => import('../pages/ordenes/OrdenDetallePage'));
const ClientesPage            = lazy(() => import('../pages/clientes/ClientesPage'));
const ClienteDetallePage      = lazy(() => import('../pages/clientes/ClienteDetallePage'));

// Pages — gated by role
const CotizacionesPage        = lazy(() => import('../pages/cotizaciones/CotizacionesPage'));
const NuevaCotizacionPage     = lazy(() => import('../pages/cotizaciones/NuevaCotizacionPage'));
const CotizacionDetallePage   = lazy(() => import('../pages/cotizaciones/CotizacionDetallePage'));
const FacturacionPage  = lazy(() => import('../pages/facturacion/FacturacionPage'));
const CarteraPage      = lazy(() => import('../pages/cartera/CarteraPage'));
const InventarioPage   = lazy(() => import('../pages/inventario/InventarioPage'));
const EmpleadosPage        = lazy(() => import('../pages/empleados/EmpleadosPage'));
const EmpleadoDetallePage  = lazy(() => import('../pages/empleados/EmpleadoDetallePage'));
const NominaPage           = lazy(() => import('../pages/empleados/NominaPage'));
const ReportesPage     = lazy(() => import('../pages/reportes/ReportesPage'));
const ConfigPage       = lazy(() => import('../pages/config/ConfigPage'));

function Wrap({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleGuard({ allowed }: { allowed: boolean }) {
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Small role-gate wrappers (hooks must be at component level)
function GuardCotizaciones() { const { can } = usePermissions(); return <RoleGuard allowed={can.cotizaciones} />; }
function GuardFacturacion()  { const { can } = usePermissions(); return <RoleGuard allowed={can.facturacion}  />; }
function GuardInventario()   { const { can } = usePermissions(); return <RoleGuard allowed={can.inventario}   />; }
function GuardNomina()       { const { can } = usePermissions(); return <RoleGuard allowed={can.nomina}       />; }
function GuardCrearOrden()   { const { can } = usePermissions(); return <RoleGuard allowed={can.crearOrdenes} />; }
function GuardConfig()       { const { can } = usePermissions(); return <RoleGuard allowed={can.configuracion} />; }

export const router = createBrowserRouter([
  {
    path:    '/login',
    element: <Wrap><LoginPage /></Wrap>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          // Dashboard
          { index: true, element: <Wrap><DashboardPage /></Wrap> },

          // Órdenes — ver (todos los roles autenticados)
          { path: 'ordenes',      element: <Wrap><OrdenesPage /></Wrap> },
          { path: 'ordenes/:id',  element: <Wrap><OrdenDetallePage /></Wrap> },

          // Órdenes — crear (admin + operario)
          {
            element: <GuardCrearOrden />,
            children: [
              { path: 'ordenes/nueva', element: <Wrap><NuevaOrdenPage /></Wrap> },
            ],
          },

          // Clientes (todos los roles)
          { path: 'clientes',      element: <Wrap><ClientesPage /></Wrap> },
          { path: 'clientes/:id',  element: <Wrap><ClienteDetallePage /></Wrap> },

          // Cotizaciones (admin + operario)
          {
            element: <GuardCotizaciones />,
            children: [
              { path: 'cotizaciones',        element: <Wrap><CotizacionesPage /></Wrap>      },
              { path: 'cotizaciones/nueva',  element: <Wrap><NuevaCotizacionPage /></Wrap>   },
              { path: 'cotizaciones/:id',    element: <Wrap><CotizacionDetallePage /></Wrap> },
            ],
          },

          // Facturación + Cartera (admin + contador)
          {
            element: <GuardFacturacion />,
            children: [
              { path: 'facturacion', element: <Wrap><FacturacionPage /></Wrap> },
              { path: 'cartera',     element: <Wrap><CarteraPage /></Wrap> },
            ],
          },

          // Inventario (admin + operario)
          {
            element: <GuardInventario />,
            children: [
              { path: 'inventario', element: <Wrap><InventarioPage /></Wrap> },
            ],
          },

          // Empleados + Nómina + Reportes (admin + contador)
          {
            element: <GuardNomina />,
            children: [
              { path: 'empleados',     element: <Wrap><EmpleadosPage /></Wrap>       },
              { path: 'empleados/:id', element: <Wrap><EmpleadoDetallePage /></Wrap> },
              { path: 'nomina',        element: <Wrap><NominaPage /></Wrap>          },
              { path: 'reportes',  element: <Wrap><ReportesPage /></Wrap> },
            ],
          },

          // Configuración (solo admin)
          {
            element: <GuardConfig />,
            children: [
              { path: 'configuracion', element: <Wrap><ConfigPage /></Wrap> },
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
