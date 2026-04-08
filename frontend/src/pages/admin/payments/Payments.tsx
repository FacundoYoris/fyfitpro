import { useEffect, useState } from 'react';
import dashboardService from '../../../services/dashboardService';
import paymentService from '../../../services/paymentService';
import { UserOverview } from '../../../types';
import './Payments.css';

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

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 4"></polyline>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export const Payments = () => {
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getUsersOverview(1, 100, selectedMonth, selectedYear);
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (userId: number, amount: number = 0) => {
    try {
      await paymentService.markMonthAsPaid(userId, selectedMonth, selectedYear, amount);
      showToast('Pago registrado correctamente');
      loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      showToast('Error al registrar pago', 'error');
    }
  };

  const handleMarkUnpaid = async (userId: number) => {
    try {
      await paymentService.markMonthAsUnpaid(userId, selectedMonth, selectedYear);
      showToast('Pago revertido');
      loadData();
    } catch (error) {
      console.error('Error reverting payment:', error);
      showToast('Error al revertir pago', 'error');
    }
  };

  const isRelevantForPeriod = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const year = createdDate.getFullYear();
    const month = createdDate.getMonth() + 1;
    if (year > selectedYear) return false;
    if (year === selectedYear && month > selectedMonth) return false;
    return true;
  };

  const filteredUsers = users.filter((user) => isRelevantForPeriod(user.createdAt));
  const pendingPayments = filteredUsers.filter(u => !u.paymentStatus.isPaid && u.isActive);
  const paidPayments = filteredUsers.filter(u => u.paymentStatus.isPaid && u.isActive);
  const displayedUsers = activeTab === 'pending' ? pendingPayments : paidPayments;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="payments-header">
        <h1 className="payments-title">CONTROL DE PAGOS</h1>
        <p className="payments-subtitle">Gestiona los pagos mensuales de los miembros</p>
      </div>

      <div className="payments-controls">
        <div className="date-selector">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="payments-stats">
        <div className="stat-card-payments paid" onClick={() => setActiveTab('paid')}>
          <div className="stat-icon">
            <CheckIcon />
          </div>
          <div className="stat-info">
            <span className="stat-number">{paidPayments.length}</span>
            <span className="stat-label">Pagados</span>
          </div>
        </div>
        <div className="stat-card-payments pending" onClick={() => setActiveTab('pending')}>
          <div className="stat-icon">
            <XIcon />
          </div>
          <div className="stat-info">
            <span className="stat-number">{pendingPayments.length}</span>
            <span className="stat-label">Pendientes</span>
          </div>
        </div>
      </div>

      <div className="payments-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <XIcon /> Pendientes ({pendingPayments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          <CheckIcon /> Pagados ({paidPayments.length})
        </button>
      </div>

      <div className="users-list">
        {displayedUsers.length > 0 ? (
          displayedUsers.map((user) => (
            <div key={user.id} className="user-payment-card">
              <div className="user-info">
                <div className="user-avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <div className="user-plan-info">
                {user.plan ? (
                  <>
                    <span className="plan-name">{user.plan.name}</span>
                    <span className="plan-price">${user.plan.price?.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="no-plan">Sin plan</span>
                )}
              </div>
              <div className="user-status">
                <span className={`status-badge ${user.paymentStatus.isPaid ? 'paid' : 'pending'}`}>
                  <span className="status-text">
                    {user.paymentStatus.isPaid ? 'Pagado' : 'Pendiente'}
                  </span>
                  <span className="status-icon">
                    {user.paymentStatus.isPaid ? '✓' : '✕'}
                  </span>
                </span>
              </div>
              <div className="user-actions">
                {user.paymentStatus.isPaid ? (
                  <div className="payment-actions">
                    <span className="payment-date">
                      Pagó: {user.paymentStatus.lastPaymentDate ? new Date(user.paymentStatus.lastPaymentDate).toLocaleDateString('es-AR') : '-'}
                    </span>
                    <button
                      className="btn-mark-unpaid"
                      onClick={() => handleMarkUnpaid(user.id)}
                    >
                      Revertir Pago
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-mark-paid"
                    onClick={() => handleMarkPaid(user.id, user.plan?.price || 0)}
                  >
                    <DollarIcon /> Registrar Pago
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-payments">
            <div className="empty-icon">
              {activeTab === 'pending' ? <CheckIcon /> : <XIcon />}
            </div>
            <h3>{activeTab === 'pending' ? '¡Todos al día!' : 'Sin pagos registrados'}</h3>
            <p>
              {activeTab === 'pending' 
                ? 'Todos los usuarios están al día con sus pagos' 
                : 'No hay pagos registrados para este mes'}
            </p>
          </div>
        )}
      </div>

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Payments;
