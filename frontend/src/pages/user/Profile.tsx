import { useEffect, useMemo, useState } from 'react';
import { Dumbbell, CreditCard, CheckCircle2, AlertTriangle, UserCircle2 } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

interface UserProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
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

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const Profile = () => {
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

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

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('es-AR') : '-';

  const isPaymentOverdue = useMemo(() => {
    if (isAdmin || !profile) return false;
    const today = new Date();
    return today.getDate() > 10 && !profile.isPaid;
  }, [isAdmin, profile]);

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

      {isPaymentOverdue ? (
        <div className="profile-alert overdue">
          <AlertTriangle size={18} />
          <div>
            <strong>Cuota atrasada</strong>
            <p>Tu pago del mes sigue pendiente y ya pasó el día 10. Regularizalo para evitar bloqueos de servicio.</p>
          </div>
        </div>
      ) : null}

      <div className="profile-panels">
        <section className="profile-panel">
          <header>
            <div className="panel-icon neutral"><UserCircle2 size={18} /></div>
            <div>
              <h3>Mi información</h3>
              <p>Datos personales registrados</p>
            </div>
          </header>
          <div className="plan-details">
            <div className="plan-row">
              <span>Nombre</span>
              <strong>{profile?.user.firstName} {profile?.user.lastName}</strong>
            </div>
            <div className="plan-row">
              <span>Email</span>
              <strong>{profile?.user.email || '-'}</strong>
            </div>
            <div className="plan-row">
              <span>Telefono</span>
              <strong>{profile?.user.phone || '-'}</strong>
            </div>
            <div className="plan-row">
              <span>DNI</span>
              <strong>{profile?.user.dni || '-'}</strong>
            </div>
          </div>
        </section>

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
              <div className="payment-period">{MONTHS[profile.payment.month - 1]} {profile.payment.year}</div>
            </div>
          ) : (
            <p className="no-data">Sin pagos registrados</p>
          )}
        </section>
      </div>

      {!profile?.payment ? (
        <section className="profile-panel">
          <header>
            <div className="panel-icon warning"><AlertTriangle size={18} /></div>
            <div>
              <h3>Sin pagos registrados</h3>
              <p>Contacta a administracion para regularizar tu membresia.</p>
            </div>
          </header>
        </section>
      ) : null}
    </div>
  );
};

export default Profile;
