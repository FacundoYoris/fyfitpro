import { useEffect, useState } from 'react';
import { Timer, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import memberService from '../../services/memberService';
import { MemberRoutine, WorkoutLogEntry } from '../../types';
import './Profile.css';

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

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const parseRepsBySet = (sets: number, reps: number, repScheme?: string) => {
  if (!repScheme || repScheme.trim().length === 0) {
    return Array.from({ length: sets }, () => reps);
  }

  const normalized = repScheme.trim().toLowerCase();
  if (normalized.includes('fallo')) {
    return Array.from({ length: sets }, () => 0);
  }

  const values = repScheme
    .split(/[-,/|]/)
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) {
    return Array.from({ length: sets }, () => reps);
  }

  return Array.from({ length: sets }, (_, index) => values[index] ?? values[values.length - 1]);
};

export const DailyTracking = () => {
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<MemberRoutine | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarCell[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<CalendarCell | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logEntries, setLogEntries] = useState<WorkoutLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'completed' | null>(null);

  useEffect(() => {
    loadRoutine();
  }, []);

  useEffect(() => {
    buildCalendar();
  }, [calendarMonth, calendarYear, routine]);

  const loadRoutine = async () => {
    try {
      const response = await memberService.getActiveRoutine();
      if (response.success && response.data) {
        setRoutine(response.data);
      }
    } catch (error) {
      console.error('Error loading routine:', error);
    } finally {
      setLoading(false);
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

  const handleDayClick = async (cell: CalendarCell) => {
    if (!cell.routineDay || cell.isOtherMonth) return;

    setSelectedDay(cell);
    setShowLogModal(true);
    setSessionStatus((cell.session?.status as 'pending' | 'completed' | undefined) || null);

    if (!routine) {
      return;
    }

    const dayExercises = routine.days.find((day) => day.id === cell.routineDay?.id)?.routineExercises || [];
    const baseEntries: WorkoutLogEntry[] = dayExercises.map((exercise) => {
      const repsBySet = parseRepsBySet(exercise.sets, exercise.reps, exercise.repScheme);

      return {
        exerciseId: exercise.exerciseId,
        sets: Array.from({ length: exercise.sets }, (_, index) => ({
          setNumber: index + 1,
          weight: exercise.lastWeight || undefined,
          reps: repsBySet[index],
        })),
      };
    });

    setLogEntries(baseEntries);

    try {
      const response = cell.session?.id
        ? await memberService.getWorkoutSessionById(cell.session.id)
        : await memberService.getWorkoutSessionByDate(cell.date);

      setSessionStatus((response.data?.session?.status as 'pending' | 'completed' | undefined) || null);

      if (!response.success || !response.data?.logs?.length) {
        return;
      }

      const logsByExercise = response.data.logs.reduce<Record<number, typeof response.data.logs>>((acc, log) => {
        if (!acc[log.exerciseId]) {
          acc[log.exerciseId] = [];
        }
        acc[log.exerciseId].push(log);
        return acc;
      }, {});

      const mergedEntries = baseEntries.map((entry) => {
        const savedLogs = logsByExercise[entry.exerciseId];
        if (!savedLogs || savedLogs.length === 0) {
          return entry;
        }

        const sortedLogs = [...savedLogs].sort((a, b) => a.setNumber - b.setNumber);
        return {
          ...entry,
          sets: sortedLogs.map((log) => ({
            setNumber: log.setNumber,
            weight: log.weight ?? undefined,
            reps: log.reps ?? undefined,
            notes: log.notes ?? undefined,
          })),
        };
      });

      setLogEntries(mergedEntries);
    } catch (error) {
      console.error('Error loading session logs:', error);
    }
  };

  const handleResetDay = async () => {
    if (!selectedDay?.routineDay) return;

    setResetting(true);
    try {
      await memberService.saveWorkoutLogs({
        date: selectedDay.date,
        routineDayId: selectedDay.routineDay.id,
        entries: [],
        status: 'pending',
      });
      setShowLogModal(false);
      buildCalendar();
    } catch (error) {
      console.error('Error resetting day:', error);
    } finally {
      setResetting(false);
    }
  };

  const saveLogs = async (status: 'pending' | 'completed') => {
    if (!selectedDay) return;

    if (status === 'completed') {
      setFinalizing(true);
    } else {
      setSaving(true);
    }

    try {
      await memberService.saveWorkoutLogs({
        date: selectedDay.date,
        routineDayId: selectedDay.routineDay!.id,
        entries: logEntries,
        status,
      });
      setSessionStatus(status);
      setShowLogModal(false);
      buildCalendar();
    } catch (error) {
      console.error('Error saving logs:', error);
    } finally {
      if (status === 'completed') {
        setFinalizing(false);
      } else {
        setSaving(false);
      }
    }
  };

  const changeMonth = (delta: number) => {
    let newMonth = calendarMonth + delta;
    let newYear = calendarYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
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
      <section className="profile-panel calendar-section">
        <header>
          <div className="panel-icon neutral"><Timer size={18} /></div>
          <div>
            <h3>Seguimiento día a día</h3>
            <p>
              {routine ? `Rutina actual: ${routine.routine.name}` : 'Sin rutina activa'}
            </p>
          </div>
        </header>

        {routine ? (
          <>
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
                {WEEKDAYS.map((weekday) => <div key={weekday} className="cal-h-cell">{weekday}</div>)}
              </div>
              <div className="cal-body">
                {Array.from({ length: Math.ceil(calendarDays.length / 6) }, (_, weekIndex) => (
                  <div key={weekIndex} className="cal-row">
                    {calendarDays.slice(weekIndex * 6, weekIndex * 6 + 6).map((cell, index) => {
                      const hasRoutine = !!cell.routineDay && !cell.isOtherMonth;
                      const isCompleted = hasRoutine && cell.session?.status === 'completed';
                      const isToday = !cell.isOtherMonth && new Date(cell.date).toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={index}
                          className={`cal-cell ${cell.isOtherMonth ? 'other-month' : ''} ${hasRoutine ? 'has-routine' : ''} ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${hasRoutine ? 'clickable' : ''}`}
                          onClick={() => handleDayClick(cell)}
                        >
                          <span className="cal-day-num">{cell.day}</span>
                          {hasRoutine ? <span className="cal-day-badge">D{cell.routineDay!.dayNumber}</span> : null}
                          {hasRoutine && cell.session?.exerciseCount ? <span className="cal-ex-count">{cell.session.exerciseCount} ejercicios</span> : null}
                          {isCompleted ? <span className="cal-check">✓</span> : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-routines">
            <p>No tienes rutinas asignadas</p>
            <p className="empty-hint">Contacta al administrador para que te asigne una rutina.</p>
          </div>
        )}
      </section>

      {showLogModal && selectedDay ? (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content log-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Anotar peso - {selectedDay.routineDay?.name}</h3>
              <div className="modal-header-actions">
                {sessionStatus === 'completed' ? (
                  <button className="btn-header-action btn-header-action-reset" onClick={handleResetDay} disabled={saving || finalizing || resetting}>
                    {resetting ? 'Reestableciendo...' : 'Reestablecer dia'}
                  </button>
                ) : (
                  <button className="btn-header-action" onClick={() => saveLogs('completed')} disabled={saving || finalizing || resetting}>
                    {finalizing ? 'Finalizando...' : 'Finalizar dia'}
                  </button>
                )}
                <button className="modal-close" onClick={() => setShowLogModal(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="modal-body">
              {logEntries.map((entry, entryIndex) => {
                const exercise = routine?.days
                  .flatMap((day) => day.routineExercises)
                  .find((routineExercise) => routineExercise.exerciseId === entry.exerciseId);
                const setsCount = entry.sets.length;
                const allSameReps = setsCount > 1 && entry.sets.every((set) => set.reps === entry.sets[0].reps);

                return (
                  <div key={entryIndex} className="log-exercise">
                    <h4>{exercise?.exercise.name}</h4>
                    {allSameReps ? (
                      <div className="log-common-row">
                        <span className="log-label">Kg ({entry.sets[0].reps} reps):</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={entry.sets[0].weight || ''}
                          onChange={(event) => {
                            const newEntries = [...logEntries];
                            const weight = parseFloat(event.target.value) || 0;
                            newEntries[entryIndex].sets.forEach((set) => {
                              set.weight = weight;
                            });
                            setLogEntries(newEntries);
                          }}
                          placeholder="kg"
                          className="log-input"
                        />
                      </div>
                    ) : (
                      <div className="log-inline-sets">
                        {entry.sets.map((set, setIndex) => (
                          <div key={setIndex} className="log-set-inline">
                            <span className="log-set-label">S{set.setNumber}</span>
                            <div className="log-inline-inputs">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={set.weight || ''}
                                onChange={(event) => {
                                  const newEntries = [...logEntries];
                                  newEntries[entryIndex].sets[setIndex].weight = parseFloat(event.target.value) || 0;
                                  setLogEntries(newEntries);
                                }}
                                placeholder="kg"
                                className="log-input small"
                              />
                              <span className="log-reps-chip">{set.reps || 0}</span>
                            </div>
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
              <button className="btn-save" onClick={() => saveLogs('pending')} disabled={saving || finalizing || resetting}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DailyTracking;
