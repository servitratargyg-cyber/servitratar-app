import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, FileText, Wallet,
  FileSpreadsheet, Package, UserCog, DollarSign, BarChart3,
  Settings, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth, usePermissions } from '../../hooks/useAuth';

interface NavItem {
  label:    string;
  href:     string;
  icon:     React.ReactNode;
  show:     boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle:  () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { signOut, profile } = useAuth();
  const perms = usePermissions();

  const navItems: NavItem[] = [
    { label: 'Dashboard',     href: '/',             icon: <LayoutDashboard className="h-5 w-5" />, show: true },
    { label: 'Órdenes',       href: '/ordenes',      icon: <ClipboardList className="h-5 w-5" />,  show: true },
    { label: 'Clientes',      href: '/clientes',     icon: <Users className="h-5 w-5" />,          show: true },
    { label: 'Cotizaciones',  href: '/cotizaciones', icon: <FileSpreadsheet className="h-5 w-5" />, show: perms.can.cotizaciones },
    { label: 'Facturación',   href: '/facturacion',  icon: <FileText className="h-5 w-5" />,       show: perms.can.facturacion },
    { label: 'Cartera',       href: '/cartera',      icon: <Wallet className="h-5 w-5" />,         show: perms.can.cartera },
    { label: 'Inventario',    href: '/inventario',   icon: <Package className="h-5 w-5" />,        show: perms.can.inventario },
    { label: 'Empleados',     href: '/empleados',    icon: <UserCog className="h-5 w-5" />,        show: perms.can.empleados },
    { label: 'Nómina',        href: '/nomina',       icon: <DollarSign className="h-5 w-5" />,     show: perms.can.nomina },
    { label: 'Reportes',      href: '/reportes',     icon: <BarChart3 className="h-5 w-5" />,      show: perms.can.reportes },
    { label: 'Configuración', href: '/config',       icon: <Settings className="h-5 w-5" />,       show: perms.can.configuracion },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[#1a1a2e] text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo / header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 min-h-[60px]">
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide text-[#e8734a]">SERVITRATAR</span>
            <span className="text-[10px] text-white/50">G&G S.A.S.</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors ml-auto"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.filter(i => i.show).map(item => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#e8734a] text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer user info */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && profile && (
          <div className="px-2 pb-2">
            <p className="text-xs font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-[10px] text-white/40 uppercase">{profile.role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
