import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../../../services/userService';
import planService from '../../../services/planService';
import routineService from '../../../services/routineService';
import paymentService from '../../../services/paymentService';
import { Payment, Plan, Routine, User, UserPlan, UserRoutine } from '../../../types';
import './UserDetail.css';

export const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserData(parseInt(id, 10));
    }
  }, [id]);

  const loadUserData = async (userId: number) => {
    try {
      const [userRes, plansRes, routinesRes, paymentsRes] = await Promise.all([
        userService.getUserById(userId),
        planService.getUserPlans(userId),
        routineService.getUserRoutines(userId),
        paymentService.getUserPayments(userId),
      ]);

      if (userRes.success && userRes.data) setUser(userRes.data);
      if (plansRes.success && plansRes.data) setUserPlans(plansRes.data);
      if (routinesRes.success && routinesRes.data) setUserRoutines(routinesRes.data);
      if (paymentsRes.success && paymentsRes.data) setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-AR');
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="empty-state">
        <p>Usuario no encontrado</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
          Volver
        </button>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
  const activePlan = userPlans.find((plan) => plan.isActive);

  return (
    <div className="user-detail-page">
      <div className="user-hero">
        <div className="hero-left">
          <button className="back-btn" onClick={() => navigate('/admin/users')}>
            ← Volver
          </button>
          <div className="hero-main">
            <div className="hero-avatar">{initials || '?'}</div>
            <div>
              <p className="hero-kicker">Perfil de miembro</p>
              <h1>{user.firstName} {user.lastName}</h1>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
            {user.isActive ? 'Activo' : 'Inactivo'}
          </span>
          <RegisterPaymentButton
            userId={user.id}
            defaultAmount={activePlan?.plan?.price}
            onRegister={() => loadUserData(parseInt(id!, 10))}
          />
        </div>
      </div>

      <div className="user-sections-grid">
        <section className="user-panel">
          <div className="panel-header">
            <div>
              <h3>Datos personales</h3>
              <p>Información general del miembro</p>
            </div>
            <div className="member-since">
              <span className="detail-value hero-name">{user.firstName} {user.lastName}</span>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Miembro desde</span>
              <span className="detail-value">{formatDate(user.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Teléfono</span>
              <span className="detail-value">{user.phone || 'Sin registrar'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">DNI</span>
              <span className="detail-value">{user.dni || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <span className="detail-value">{user.isActive ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </section>

        <section className="user-panel">
          <div className="panel-header">
            <div>
              <h3>Planes asignados</h3>
              <p>{userPlans.length ? 'Historial completo de planes' : 'Aún no tiene planes asignados'}</p>
            </div>
          </div>
          {userPlans.length ? (
            <div className="plans-grid">
              {userPlans.map((up) => (
                <article key={up.id} className="plan-card">
                  <header>
                    <h4>{up.plan?.name || 'Plan sin nombre'}</h4>
                  </header>
                  <div className="plan-meta">
                    <div>
                      <small>Inicio</small>
                      <strong>{formatDate(up.startDate)}</strong>
                    </div>
                    <div>
                      <small>Fin</small>
                      <strong>{up.endDate ? formatDate(up.endDate) : 'Sin definir'}</strong>
                    </div>
                    <div>
                      <small>Precio</small>
                      <strong>{up.plan?.price ? formatCurrency(up.plan.price) : '-'}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <p>No hay planes asignados</p>
              </div>
          )}
          <div className="panel-footer">
            <AssignPlanButton userId={user.id} onAssign={() => loadUserData(parseInt(id!, 10))} />
          </div>
        </section>

        <section className="user-panel">
          <div className="panel-header">
            <div>
              <h3>Rutinas asignadas</h3>
              <p>{userRoutines.length ? 'Seguimiento actualizado' : 'Aún no tiene rutinas'}</p>
            </div>
            <AssignRoutineButton userId={user.id} onAssign={() => loadUserData(parseInt(id!, 10))} />
          </div>
          {userRoutines.length ? (
            <div className="routine-timeline">
              {userRoutines.map((ur) => (
                <article key={ur.id} className="routine-item">
                  <div className="routine-marker">
                    <span />
                  </div>
                  <div className="routine-body">
                    <div className="routine-header">
                      <h4>{ur.routine?.name || 'Rutina sin nombre'}</h4>
                      <span className={`badge ${ur.isActive ? 'badge-success' : 'badge-gray'}`}>
                        {ur.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p>Asignada el {formatDate(ur.assignedAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <p>No hay rutinas asignadas</p>
            </div>
          )}
        </section>

        <section className="user-panel">
          <div className="panel-header">
            <div>
              <h3>Historial de pagos</h3>
              <p>{payments.length ? 'Últimos pagos registrados' : 'Aún no registró pagos'}</p>
            </div>
            <RegisterPaymentButton
              userId={user.id}
              defaultAmount={activePlan?.plan?.price}
              onRegister={() => loadUserData(parseInt(id!, 10))}
            />
          </div>
          {payments.length ? (
            <div className="payments-list">
              {payments.map((p) => (
                <article key={p.id} className="payment-row">
                  <div>
                    <h5>{formatCurrency(p.amount)}</h5>
                    <p>{formatDate(p.paymentDate)} · {p.paymentMethod || 'Método no informado'}</p>
                  </div>
                  <span className="period-chip">{p.month}/{p.year}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <p>No hay pagos registrados</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

interface AssignPlanButtonProps {
  userId: number;
  onAssign: () => void;
}

const AssignPlanButton: React.FC<AssignPlanButtonProps> = ({ userId, onAssign }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal) {
      loadPlans();
    }
  }, [showModal]);

  const loadPlans = async () => {
    const res = await planService.getPlans();
    if (res.success && res.data) {
      setPlans(res.data);
    }
  };

  const handleAssign = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      await planService.assignPlan(userId, parseInt(selectedPlanId, 10));
      setShowModal(false);
      onAssign();
    } catch (error) {
      console.error('Error assigning plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
        + Asignar Plan
      </button>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Asignar Plan</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Seleccionar Plan</label>
                <select
                  className="form-select"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedPlanId || loading}>
                {loading ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface AssignRoutineButtonProps {
  userId: number;
  onAssign: () => void;
}

const AssignRoutineButton: React.FC<AssignRoutineButtonProps> = ({ userId, onAssign }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal) {
      loadRoutines();
    }
  }, [showModal]);

  const loadRoutines = async () => {
    const res = await routineService.getRoutines();
    if (res.success && res.data) {
      setRoutines(res.data);
    }
  };

  const handleAssign = async () => {
    if (!selectedRoutineId) return;
    setLoading(true);
    try {
      await routineService.assignRoutine(userId, parseInt(selectedRoutineId, 10));
      setShowModal(false);
      onAssign();
    } catch (error) {
      console.error('Error assigning routine:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
        + Asignar Rutina
      </button>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Asignar Rutina</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Seleccionar Rutina</label>
                <select
                  className="form-select"
                  value={selectedRoutineId}
                  onChange={(e) => setSelectedRoutineId(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedRoutineId || loading}>
                {loading ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface RegisterPaymentButtonProps {
  userId: number;
  defaultAmount?: number;
  onRegister: () => void;
}

const RegisterPaymentButton: React.FC<RegisterPaymentButtonProps> = ({ userId, defaultAmount, onRegister }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: 'cash',
  });
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  const openModal = () => {
    setFormData((prev) => ({
      ...prev,
      amount: defaultAmount && defaultAmount > 0 ? defaultAmount.toString() : '',
    }));
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleRegister = async () => {
    const amountValue = parseFloat(formData.amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }

    setLoading(true);
    try {
      await paymentService.markMonthAsPaid(
        userId,
        formData.month,
        formData.year,
        amountValue,
        formData.paymentMethod,
      );
      closeModal();
      onRegister();
    } catch (error) {
      console.error('Error registering payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={openModal}>
        + Registrar Pago
      </button>
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Pago</h3>
              <button onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (error && parseFloat(e.target.value) > 0) {
                      setError('');
                    }
                  }}
                  placeholder={defaultAmount ? defaultAmount.toString() : '0'}
                  min="1"
                  step="0.01"
                />
                {error && <small style={{ color: '#f87171' }}>{error}</small>}
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Mes</label>
                  <select
                    className="form-select"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value, 10) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Año</label>
                  <select
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <select
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetail;
