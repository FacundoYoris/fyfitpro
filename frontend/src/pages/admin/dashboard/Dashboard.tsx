import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, CreditCard as CreditCardIcon, ClipboardList as ClipboardListIcon, Flame } from 'lucide-react';
import dashboardService from '../../../services/dashboardService';
import { DashboardStats, UserOverview } from '../../../types';
import './Dashboard.css';

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ActiveIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TicketIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 0 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1 0-4z" />
    <line x1="12" y1="12" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="16" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
  </svg>
);

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [statsRes, usersRes] = await Promise.all([
        dashboardService.getStats(selectedMonth, selectedYear),
        dashboardService.getUsersOverview(1, 5, selectedMonth, selectedYear),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const years = [selectedYear - 1, selectedYear, selectedYear + 1];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);

  const statsCards = useMemo(() => [
    {
      label: 'Usuarios totales',
      value: stats?.totalUsers ?? 0,
      detail: `${stats?.activeUsers ?? 0} activos`,
      accent: 'cyan',
      icon: <UsersIcon />,
    },
    {
      label: 'Usuarios activos',
      value: stats?.activeUsers ?? 0,
      detail: `${(stats?.totalUsers ?? 0) - (stats?.activeUsers ?? 0)} inactivos`,
      accent: 'emerald',
      icon: <ActiveIcon />,
    },
    {
      label: 'Ingresos del mes',
      value: formatCurrency(stats?.revenueThisMonth ?? 0),
      detail: `${stats?.paymentsThisMonth ?? 0} pagos`,
      accent: 'amber',
      icon: <MoneyIcon />,
    },
    {
      label: 'Pagos registrados',
      value: stats?.paymentsThisMonth ?? 0,
      detail: 'Últimos 30 días',
      accent: 'violet',
      icon: <TicketIcon />,
    },
  ], [stats]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-kicker">VISIÓN GENERAL</p>
          <h1 className="dashboard-title">Gestión Integral</h1>
          <p className="dashboard-subtitle">Monitorea usuarios, ingresos y actividad</p>
        </div>
        <div className="dashboard-controls">
          <div className="month-selectors">
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button className={`btn-dashboard ${refreshing ? 'loading' : ''}`} onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon /> {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        {statsCards.map((card) => (
          <div key={card.label} className={`dash-stat-card accent-${card.accent}`}>
            <div className="stat-icon-wrapper">{card.icon}</div>
            <div>
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
              <span className="stat-detail">{card.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Últimos miembros</h3>
              <p>Los 5 registros más recientes</p>
            </div>
            <Link to="/admin/users" className="btn-link">Ver todos</Link>
          </div>

          {users.length > 0 ? (
            <div className="recent-users-list">
              {users.map((user) => {
                const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
                return (
                  <div key={user.id} className="recent-user-item">
                    <div className="recent-user-main">
                      <div className="recent-avatar">{initials || '?'}</div>
                      <div>
                        <strong>{user.firstName} {user.lastName}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="recent-user-pill">
                      {user.plan ? user.plan.name : 'Sin plan'}
                    </div>
                    <span className={`badge-payment ${user.paymentStatus.isPaid ? 'paid' : 'pending'}`}>
                      {user.paymentStatus.isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty">
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Resumen financiero</h3>
              <p>Datos del mes actual</p>
            </div>
            <Link to="/admin/payments" className="btn-link">Registrar pago</Link>
          </div>

          <div className="finance-summary">
            <div>
              <span>Ingresos del mes</span>
              <strong>{formatCurrency(stats?.revenueThisMonth ?? 0)}</strong>
            </div>
            <div>
              <span>Pagos registrados</span>
              <strong>{stats?.paymentsThisMonth ?? 0}</strong>
            </div>
          </div>

            <div className="quick-actions-grid">
              <Link to="/admin/users/new" className="quick-action">
                <div className="quick-icon"><UserPlus size={16} /></div>
                <div>
                  <strong>Nuevo usuario</strong>
                  <span>Registrar miembro</span>
                </div>
              </Link>
              <Link to="/admin/plans" className="quick-action">
                <div className="quick-icon"><CreditCardIcon size={16} /></div>
                <div>
                  <strong>Gestionar planes</strong>
                  <span>Crear o editar</span>
                </div>
              </Link>
              <Link to="/admin/routines" className="quick-action">
                <div className="quick-icon"><ClipboardListIcon size={16} /></div>
                <div>
                  <strong>Rutinas</strong>
                  <span>Asignar programas</span>
                </div>
              </Link>
              <Link to="/admin/exercises" className="quick-action">
                <div className="quick-icon"><Flame size={16} /></div>
                <div>
                  <strong>Ejercicios</strong>
                  <span>Actualizar catálogo</span>
                </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
