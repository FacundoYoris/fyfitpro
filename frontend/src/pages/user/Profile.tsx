import { useEffect, useState } from 'react';
import { Dumbbell, CreditCard, CheckCircle2, AlertTriangle, Timer, ChevronLeft, ChevronRight, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import authService from '../../services/authService';
import memberService from '../../services/memberService';
import { MemberRoutine, MemberRoutineDay, WorkoutLogEntry } from '../../types';
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

interface CalendarCell {
  day: number;
  date: string;
  isOtherMonth: boolean;
  routineDay: {
    id: number;
    name: string;
    dayNumber: number;
  } | null;
  session: {
    id: number;
    status: string;
    exerciseCount: number;
  } | null;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<MemberRoutine | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarCell[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<CalendarCell | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logEntries, setLogEntries] = useState<WorkoutLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    buildCalendar();
  }, [calendarMonth, calendarYear, routine]);

  const loadProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
      await loadRoutine();
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoutine = async () => {
    try {
      const response = await memberService.getActiveRoutine();
      if (response.success && response.data) {
        setRoutine(response.data);
      }
    } catch (error) {
      console.error('Error loading routine:', error);
    }
  };

  const buildCalendar = async () => {
    try {
      const response = await memberService.getCalendar(calendarMonth + 1, calendarYear);
      if (response.success && response.data) {
        setCalendarDays(response.data.days as CalendarCell[]);
      }
    } catch (error) {
      console.error('Error building calendar:', error);
    }
  };

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('es-AR') : '-';

  const handleDayClick = (cell: CalendarCell) => {
    if (!cell.routineDay || cell.isOtherMonth) return;
    setSelectedDay(cell);
    setShowLogModal(true);

    if (routine) {
      const dayExercises = routine.days.find(d => d.id === cell.routineDay?.id)?.routineExercises || [];
      setLogEntries(dayExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          weight: ex.lastWeight || undefined,
          reps: ex.reps,
        })),
      })));
    }
  };

  const handleSaveLogs = async () => {
    if (!selectedDay) return;
    setSaving(true);
    try {
      await memberService.saveWorkoutLogs({
        date: selectedDay.date,
        routineDayId: selectedDay.routineDay!.id,
        entries: logEntries,
        status: 'completed',
      });
      setShowLogModal(false);
      buildCalendar();
    } catch (error) {
      console.error('Error saving logs:', error);
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (delta: number) => {
    let newMonth = calendarMonth + delta;
    let newYear = calendarYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const toggleDayDetail = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
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
              <div className="payment-period">{MONTHS[profile.payment.month - 1]} {profile.payment.year}</div>
            </div>
          ) : (
            <p className="no-data">Sin pagos registrados</p>
          )}
        </section>
      </div>

      {routine ? (
        <section className="profile-panel calendar-section">
          <header>
            <div className="panel-icon neutral"><Timer size={18} /></div>
            <div>
              <h3>Mi Rutina - {routine.routine.name}</h3>
              <p>{routine.days.length} días por semana</p>
            </div>
          </header>

          <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)} className="cal-nav-btn"><ChevronLeft size={18} /></button>
            <span className="cal-month-label">{MONTHS[calendarMonth]} {calendarYear}</span>
            <button onClick={() => changeMonth(1)} className="cal-nav-btn"><ChevronRight size={18} /></button>
          </div>

          <div className="cal-legend">
            <span className="cal-legend-item"><i className="dot dot-routine" /> Día de rutina</span>
            <span className="cal-legend-item"><i className="dot dot-completed" /> Completado</span>
            <span className="cal-legend-item"><i className="dot dot-today" /> Hoy</span>
          </div>

          <div className="calendar-table">
            <div className="cal-header">
              {WEEKDAYS.map(d => <div key={d} className="cal-h-cell">{d}</div>)}
            </div>
            <div className="cal-body">
              {Array.from({ length: Math.ceil(calendarDays.length / 6) }, (_, wi) => (
                <div key={wi} className="cal-row">
                  {calendarDays.slice(wi * 6, wi * 6 + 6).map((cell, idx) => {
                    const hasRoutine = !!cell.routineDay && !cell.isOtherMonth;
                    const isCompleted = cell.session?.status === 'completed';
                    const isToday = !cell.isOtherMonth && new Date(cell.date).toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={idx}
                        className={`cal-cell ${cell.isOtherMonth ? 'other-month' : ''} ${hasRoutine ? 'has-routine' : ''} ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${hasRoutine ? 'clickable' : ''}`}
                        onClick={() => handleDayClick(cell)}
                      >
                        <span className="cal-day-num">{cell.day}</span>
                        {hasRoutine && (
                          <span className="cal-day-badge">D{cell.routineDay!.dayNumber}</span>
                        )}
                        {hasRoutine && cell.session?.exerciseCount ? (
                          <span className="cal-ex-count">{cell.session.exerciseCount} ejercicios</span>
                        ) : null}
                        {isCompleted && <span className="cal-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="routine-exercises-section">
            <h4>Ejercicios de la rutina</h4>
            {routine.days.map((day: MemberRoutineDay) => (
              <div key={day.id} className="routine-day-block">
                <button className="routine-day-header" onClick={() => toggleDayDetail(day.id)}>
                  <span>{day.name}</span>
                  {expandedDay === day.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedDay === day.id && (
                  <ul className="exercise-list">
                    {day.routineExercises.map((ex) => (
                      <li key={ex.id} className="exercise-item">
                        <span className="exercise-name">{ex.exercise.name}</span>
                        <span className="exercise-sets">{ex.sets}x{ex.reps}</span>
                        {ex.lastWeight && (
                          <span className="exercise-weight">Último: {ex.lastWeight}kg</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="profile-panel routines-panel">
          <header>
            <div className="panel-icon neutral"><Timer size={18} /></div>
            <div>
              <h3>Mis rutinas</h3>
              <p>Actividades asignadas recientemente</p>
            </div>
          </header>
          <div className="empty-routines">
            <p>No tienes rutinas asignadas</p>
            <p className="empty-hint">Contacta al administrador para que te asigne una rutina</p>
          </div>
        </section>
      )}

      {showLogModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content log-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar - {selectedDay.routineDay?.name}</h3>
              <button className="modal-close" onClick={() => setShowLogModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {logEntries.map((entry, idx) => {
                const exercise = routine?.days
                  .flatMap(d => d.routineExercises)
                  .find(e => e.exerciseId === entry.exerciseId);
                const setsCount = entry.sets.length;
                const allSameReps = setsCount > 1 && entry.sets.every(s => s.reps === entry.sets[0].reps);

                return (
                  <div key={idx} className="log-exercise">
                    <h4>{exercise?.exercise.name}</h4>
                    {allSameReps ? (
                      <div className="log-common-row">
                        <span className="log-label">Peso ({entry.sets[0].reps} reps c/u):</span>
                        <input
                          type="number"
                          value={entry.sets[0].weight || ''}
                          onChange={(e) => {
                            const newEntries = [...logEntries];
                            const w = parseFloat(e.target.value) || 0;
                            newEntries[idx].sets.forEach(s => s.weight = w);
                            setLogEntries(newEntries);
                          }}
                          placeholder="kg"
                          className="log-input"
                        />
                      </div>
                    ) : (
                      <div className="log-sets-list">
                        {entry.sets.map((set, si) => (
                          <div key={si} className="log-set-row">
                            <span className="log-set-label">Set {set.setNumber}</span>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => {
                                const newEntries = [...logEntries];
                                newEntries[idx].sets[si].weight = parseFloat(e.target.value) || 0;
                                setLogEntries(newEntries);
                              }}
                              placeholder="kg"
                              className="log-input small"
                            />
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => {
                                const newEntries = [...logEntries];
                                newEntries[idx].sets[si].reps = parseInt(e.target.value) || 0;
                                setLogEntries(newEntries);
                              }}
                              placeholder="reps"
                              className="log-input small"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowLogModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSaveLogs} disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
