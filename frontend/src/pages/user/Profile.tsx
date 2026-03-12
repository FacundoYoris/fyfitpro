import { useEffect, useState } from 'react';
import { Dumbbell, CreditCard, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';
import authService from '../../services/authService';
import './Profile.css';

interface UserProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dni?: string;
  };
  plan: {
    id: number;
    name: string;
    price: number;
    endDate: string | null;
    daysPerWeek: number | null;
  } | null;
  routines: {
    id: number;
    name: string;
    description: string | null;
    duration: number | null;
    exercises: number;
    assignedAt: string;
  }[];
  payment: {
    amount: number;
    month: number;
    year: number;
    paymentDate: string;
  } | null;
  isPaid: boolean;
}

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('es-AR') : '-';

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'Sin duración';
    return `${duration} min`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="hero-avatar">
          {profile?.user.firstName?.charAt(0)}{profile?.user.lastName?.charAt(0)}
        </div>
        <div>
          <p className="hero-kicker">Mi cuenta</p>
          <h1>{profile?.user.firstName} {profile?.user.lastName}</h1>
          <p className="hero-meta">{profile?.user.email}</p>
          {profile?.user.phone && <p className="hero-meta">{profile.user.phone}</p>}
        </div>
        <div className="hero-actions">
          <div>
            <small>Plan actual</small>
            <strong>{profile?.plan?.name || 'Sin plan'}</strong>
          </div>
          <div>
            <small>Estado de pago</small>
            <strong>{profile?.isPaid ? 'Al día' : 'Pendiente'}</strong>
          </div>
        </div>
      </div>

      <div className="profile-panels">
        <section className="profile-panel">
          <header>
            <div className="panel-icon primary"><Dumbbell size={18} /></div>
            <div>
              <h3>Mi plan</h3>
              <p>Resumen del plan actual</p>
            </div>
          </header>
          {profile?.plan ? (
            <div className="plan-details">
              <div className="plan-row">
                <span>Nombre</span>
                <strong>{profile.plan.name}</strong>
              </div>
              <div className="plan-row">
                <span>Precio</span>
                <strong>${profile.plan.price}/mes</strong>
              </div>
              {profile.plan.daysPerWeek && (
                <div className="plan-row">
                  <span>Frecuencia</span>
                  <strong>{profile.plan.daysPerWeek} días por semana</strong>
                </div>
              )}
              {profile.plan.endDate && (
                <div className="plan-row">
                  <span>Vence</span>
                  <strong>{formatDate(profile.plan.endDate)}</strong>
                </div>
              )}
            </div>
          ) : (
            <p className="no-data">Sin plan asignado</p>
          )}
        </section>

        <section className="profile-panel">
          <header>
            <div className="panel-icon warning"><CreditCard size={18} /></div>
            <div>
              <h3>Estado de pago</h3>
              <p>Último periodo facturado</p>
            </div>
          </header>
          {profile?.payment ? (
            <div className="payment-summary">
              <div className={`payment-status ${profile.isPaid ? 'paid' : 'pending'}`}>
                {profile.isPaid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {profile.isPaid ? 'Al día' : 'Pendiente'}
              </div>
              <div className="payment-amount">${profile.payment.amount}</div>
              <div className="payment-period">{getMonthName(profile.payment.month)} {profile.payment.year}</div>
            </div>
          ) : (
            <p className="no-data">Sin pagos registrados</p>
          )}
        </section>
      </div>

      <section className="profile-panel routines-panel">
        <header>
          <div className="panel-icon neutral"><Timer size={18} /></div>
          <div>
            <h3>Mis rutinas</h3>
            <p>Actividades asignadas recientemente</p>
          </div>
        </header>
        {profile?.routines && profile.routines.length > 0 ? (
          <div className="routines-grid">
            {profile.routines.map((routine) => (
              <article key={routine.id} className="routine-card">
                <div className="routine-header">
                  <h4>{routine.name}</h4>
                  <span className="routine-duration">
                    <Timer size={14} /> {formatDuration(routine.duration)}
                  </span>
                </div>
                {routine.description && <p className="routine-description">{routine.description}</p>}
                <div className="routine-meta">
                  <span>{routine.exercises} ejercicios</span>
                  <span>Asignada: {formatDate(routine.assignedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-routines">
            <p>No tienes rutinas asignadas</p>
            <p className="empty-hint">Contacta al administrador para que te asigne una rutina</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
