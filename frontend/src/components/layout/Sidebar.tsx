import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet2,
  ClipboardList,
  Dumbbell as DumbbellIcon,
  UserCircle2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const adminMenuItems: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Principal',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { path: '/admin/users', label: 'Usuarios', icon: Users },
      { path: '/admin/plans', label: 'Membresías', icon: CreditCard },
      { path: '/admin/payments', label: 'Pagos', icon: Wallet2 },
      { path: '/admin/routines', label: 'Rutinas', icon: ClipboardList },
      { path: '/admin/exercises', label: 'Ejercicios', icon: DumbbellIcon },
    ],
  },
];

const userMenuItems: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Mi Perfil',
    items: [
      { path: '/profile', label: 'Mi Perfil', icon: UserCircle2 },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

export const Sidebar = ({
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      {mobileOpen ? <div className="sidebar-backdrop" onClick={onCloseMobile} /> : null}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <img src="/logo-fy-fitpro.png" alt="FY FitPro" />
        </h1>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Comprimir menú'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <span className="sidebar-section-title">{section.section}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">
                  <item.icon size={18} />
                </span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.firstName} {user?.lastName}</span>
            <span className="sidebar-user-role">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
          </div>
        </div>
        <button
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          className="sidebar-logout"
        >
          <LogOut size={16} />
          <span className="sidebar-logout-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
