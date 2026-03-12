import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Wallet2, ClipboardList, Dumbbell as DumbbellIcon, UserCircle2 } from 'lucide-react';
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

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <img src="/logo-fy-fitpro.png" alt="FY FitPro" />
        </h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.section} className="sidebar-section">
            <span className="sidebar-section-title">{section.section}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="sidebar-icon">
                  <item.icon size={18} />
                </span>
                <span>{item.label}</span>
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
        <button onClick={logout} className="sidebar-logout">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
