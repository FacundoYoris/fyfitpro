import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import routineService from '../../../services/routineService';
import exerciseService from '../../../services/exerciseService';
import muscleGroupService from '../../../services/muscleGroupService';
import userService from '../../../services/userService';
import { Exercise, User, MuscleGroup } from '../../../types';
import { getMuscleIcon } from '../../../utils/muscleIcons';
import './RoutineForm.css';

const REP_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

interface DayExercise {
  exerciseId: number;
  sets: number;
  reps: number;
  repScheme?: string;
}

const buildCustomReps = (count: number, values: string[] = []) => {
  const normalizedCount = Math.max(0, count);
  const result: string[] = [];
  for (let i = 0; i < normalizedCount; i++) {
    result.push(values[i] || '');
  }
  return result;
};


interface RoutineDay {
  dayNumber: number;
  name: string;
  exercises: DayExercise[];
}

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const RoutineForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availableGroups, setAvailableGroups] = useState<MuscleGroup[]>([]);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [activeDay, setActiveDay] = useState<number>(0);
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string>('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [newExerciseData, setNewExerciseData] = useState({
    name: '',
    muscleGroup: '',
    defaultSets: '3',
    uniformRep: '10',
    repMode: 'uniform' as 'uniform' | 'custom',
    customReps: ['10', '10', '10'],
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '90',
    daysCount: '3',
    difficulty: '3',
    userId: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    loadMuscleGroups();
  }, [id]);

  const loadData = async () => {
    try {
      const [exRes, usersRes] = await Promise.all([
        exerciseService.getExercises(),
        userService.getUsers(1, 100, '', 'active'),
      ]);

      if (exRes.success && exRes.data) setExercises(exRes.data);
      if (usersRes.success && usersRes.data) setUsers(usersRes.data.users);

      if (isEdit && id) {
        const routineRes = await routineService.getRoutineById(parseInt(id));
        if (routineRes.success && routineRes.data) {
          const r = routineRes.data as any;
          setFormData({
            name: r.name,
            description: r.description || '',
            duration: String(r.duration || 90),
            daysCount: String(r.daysCount || 3),
            difficulty: String(r.difficulty || 3),
            userId: '',
          });

          const routineDays = (r as any).routineDays || [];
          if (routineDays.length > 0) {
            setDays(routineDays.map((day: any) => ({
              dayNumber: day.dayNumber,
              name: day.name,
              exercises: (day.routineExercises || []).map((e: any) => ({
                exerciseId: e.exerciseId,
                sets: e.sets,
                reps: e.repScheme?.toLowerCase().includes('fallo') ? 0 : e.reps,
                repScheme: (e.repScheme || '').trim(),
              })),
            })));
            setActiveDay(0);
          }
        }
      } else {
        setDays([
          { dayNumber: 1, name: 'Día 1', exercises: [] },
          { dayNumber: 2, name: 'Día 2', exercises: [] },
          { dayNumber: 3, name: 'Día 3', exercises: [] },
        ]);
        setFormData((prev) => ({ ...prev, difficulty: '3' }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMuscleGroups = async () => {
    try {
      const response = await muscleGroupService.getGroups();
      if (response.success && response.data) {
        setAvailableGroups(response.data);
      }
    } catch (error) {
      console.error('Error loading muscle groups:', error);
    }
  };

  const exercisesByMuscleGroup = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {};
    exercises.forEach((ex) => {
      const group = ex.muscleGroup || 'General';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(ex);
    });
    return grouped;
  }, [exercises]);

  const exerciseGroups = Object.keys(exercisesByMuscleGroup);

  useEffect(() => {
    if (!activeMuscleGroup && exerciseGroups.length > 0) {
      setActiveMuscleGroup(exerciseGroups[0]);
    }
  }, [exerciseGroups, activeMuscleGroup]);

  const handleDaysCountChange = (count: number) => {
    const newDays: RoutineDay[] = [];
    for (let i = 0; i < count; i++) {
      if (days[i]) {
        newDays.push(days[i]);
      } else {
        newDays.push({
          dayNumber: i + 1,
          name: dayNames[i] || `Día ${i + 1}`,
          exercises: [],
        });
      }
    }
    setDays(newDays);
    if (activeDay >= count) setActiveDay(count - 1);
  };

  const isExerciseSelected = (exerciseId: number) => {
    return days[activeDay]?.exercises.some((se) => se.exerciseId === exerciseId) || false;
  };

  const addExerciseToDay = (exerciseId: number) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise || isExerciseSelected(exerciseId)) return;

    const repScheme = exercise.repScheme?.trim() || '';
    const isFailure = repScheme.toLowerCase().includes('fallo');
    const sets = exercise.defaultSets || 1;

    const newDays = [...days];
    newDays[activeDay] = {
      ...newDays[activeDay],
      exercises: [
        ...newDays[activeDay].exercises,
        {
          exerciseId,
          sets,
          reps: isFailure ? 0 : exercise.defaultReps,
          repScheme: repScheme || (isFailure ? 'Fallo' : ''),
        },
      ],
    };
    setDays(newDays);
  };

  const removeExerciseFromDay = (exerciseId: number) => {
    const newDays = [...days];
    newDays[activeDay] = {
      ...newDays[activeDay],
      exercises: newDays[activeDay].exercises.filter((se) => se.exerciseId !== exerciseId),
    };
    setDays(newDays);
  };

  const updateDayName = (dayIndex: number, name: string) => {
    const newDays = [...days];
    newDays[dayIndex].name = name;
    setDays(newDays);
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const setsCount = Math.max(1, parseInt(newExerciseData.defaultSets, 10) || 1);
      const customValues = Array.from({ length: setsCount }).map((_, index) => newExerciseData.customReps[index] || newExerciseData.uniformRep || '10');
      let repScheme: string | undefined;
      let defaultRepsValue = parseInt(newExerciseData.uniformRep, 10) || 10;

      if (newExerciseData.repMode === 'custom') {
        repScheme = customValues.filter(Boolean).join(' - ');
        const firstNumeric = customValues.find((value) => /^\d+$/.test(value));
        if (firstNumeric) {
          defaultRepsValue = parseInt(firstNumeric, 10);
        }
      } else if ((newExerciseData.uniformRep || '').toUpperCase() === 'FALLO') {
        repScheme = 'Fallo';
        defaultRepsValue = 0;
      }

      await exerciseService.createExercise({
        name: newExerciseData.name,
        muscleGroup: newExerciseData.muscleGroup || undefined,
        defaultSets: setsCount,
        defaultReps: defaultRepsValue,
        repScheme,
      });
      showToast('Ejercicio creado correctamente');
      setShowCreateExerciseModal(false);
      setNewExerciseData({ name: '', muscleGroup: '', defaultSets: '3', uniformRep: '10', repMode: 'uniform', customReps: ['10', '10', '10'] });
      const exRes = await exerciseService.getExercises();
      if (exRes.success && exRes.data) {
        setExercises(exRes.data);
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      showToast('Error al crear ejercicio', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const descriptionValue = formData.description.trim();
      const normalizedDays = days.map((day) => ({
        dayNumber: day.dayNumber,
        name: day.name,
        exercises: day.exercises.map((exercise) => {
          const isFailure = exercise.repScheme?.toLowerCase().includes('fallo');
          return {
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: isFailure ? 0 : exercise.reps,
            repScheme: exercise.repScheme || null,
          };
        }),
      }));

      const data = {
        name: formData.name,
        description: descriptionValue.length > 0 ? descriptionValue : null,
        duration: parseInt(formData.duration) || 90,
        daysCount: parseInt(formData.daysCount) || 3,
        difficulty: parseInt(formData.difficulty) || 3,
        days: normalizedDays,
      };

      let response;
      if (isEdit && id) {
        response = await routineService.updateRoutine(parseInt(id), data);
      } else {
        response = await routineService.createRoutine(data);
      }

      if (response.success) {
        showToast(isEdit ? 'Rutina actualizada correctamente' : 'Rutina creada correctamente');
        setTimeout(() => navigate('/admin/routines'), 1500);
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      showToast('Error al guardar rutina', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async () => {
    if (!formData.userId || !id) return;
    try {
      await routineService.assignRoutine(parseInt(formData.userId), parseInt(id));
      showToast('Rutina asignada correctamente');
      setFormData({ ...formData, userId: '' });
    } catch (error) {
      console.error('Error assigning routine:', error);
      showToast('Error al asignar rutina', 'error');
    }
  };

  return (
    <div className="routine-form-page">
      <div className="routine-form-header">
        <h1 className="routine-form-title">{isEdit ? 'EDITAR RUTINA' : 'NUEVA RUTINA'}</h1>
      </div>

      <div className="routine-form-grid">
        <div className="routine-form-card">
          <h3 className="routine-form-card-title">DATOS DE LA RUTINA</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Rutina Full Body"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la rutina..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Días por semana</label>
                <select
                  className="form-select"
                  value={formData.daysCount}
                  onChange={(e) => {
                    setFormData({ ...formData, daysCount: e.target.value });
                    handleDaysCountChange(parseInt(e.target.value));
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>{n} días</option>
                  ))}
                </select>
              </div>

            <div className="form-group">
              <label className="form-label">Duración</label>
              <input
                type="number"
                className="form-input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="90"
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Dificultad</label>
              <select
                className="form-select"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {`${level}`}
                  </option>
                ))}
              </select>
              <div className="difficulty-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <span
                    key={starIndex}
                    className={`star ${starIndex < Number(formData.difficulty) ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-save-routine" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'ACTUALIZAR RUTINA' : 'CREAR RUTINA'}
          </button>
          </form>
        </div>

        <div className="routine-form-card">
          <div className="routine-form-card-title-row">
            <h3 className="routine-form-card-title">EJERCICIOS POR DÍA</h3>
            <button
              type="button"
              className="btn-create-exercise"
              onClick={() => {
                setNewExerciseData({ name: '', muscleGroup: '', defaultSets: '3', uniformRep: '10', repMode: 'uniform', customReps: ['10', '10', '10'] });
                setShowCreateExerciseModal(true);
              }}
            >
              + Crear Ejercicio
            </button>
          </div>

          <div className="days-tabs">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                className={`day-tab ${activeDay === index ? 'active' : ''}`}
                onClick={() => setActiveDay(index)}
              >
                <span className="day-number">{day.dayNumber}</span>
                <span className="day-name">{day.name}</span>
                <span className="day-exercise-count">{day.exercises.length}</span>
              </button>
            ))}
          </div>

          {days.length > 0 && (
            <div className="day-name-input">
              <input
                type="text"
                className="form-input"
                value={days[activeDay].name}
                onChange={(e) => updateDayName(activeDay, e.target.value)}
                placeholder="Nombre del día"
              />
            </div>
          )}

          {days.length > 0 && (
            <>
              <div className="muscle-group-tabs">
                {exerciseGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={`muscle-tab ${activeMuscleGroup === group ? 'active' : ''}`}
                    onClick={() => setActiveMuscleGroup(group)}
                  >
                    <span className="muscle-tab-icon">{getMuscleIcon(group)}</span>
                    <span>{group}</span>
                    <span className="muscle-tab-count">
                      {exercisesByMuscleGroup[group]?.length || 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="exercise-select-grid">
                {activeMuscleGroup && exercisesByMuscleGroup[activeMuscleGroup]?.map((exercise) => {
                  const selected = isExerciseSelected(exercise.id);
                  return (
                    <div
                      key={exercise.id}
                      className={`exercise-select-card ${selected ? 'selected' : ''}`}
                    >
                      <div className="exercise-select-info">
                        <span className="exercise-select-name">{exercise.name}</span>
                        <span className="exercise-select-details">
                          {exercise.defaultSets} series · {exercise.repScheme ? exercise.repScheme : `${exercise.defaultReps} reps`}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={selected ? 'btn btn-remove' : 'btn btn-add'}
                        onClick={() => selected ? removeExerciseFromDay(exercise.id) : addExerciseToDay(exercise.id)}
                      >
                        {selected ? <XIcon /> : <PlusIcon />}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="selected-exercises">
                <h4 className="selected-title">
                  Ejercicios {days[activeDay].name} ({days[activeDay].exercises.length})
                </h4>
                
                <div className="selected-list">
                  {days[activeDay].exercises.map((se, index) => {
                    const exercise = exercises.find((e) => e.id === se.exerciseId);
                    return (
                      <div key={index} className="selected-item">
                        <div className="selected-item-header">
                          <span className="selected-item-name">
                            {exercise?.name}
                          </span>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeExerciseFromDay(se.exerciseId)}
                          >
                            <XIcon />
                          </button>
                        </div>
                        <div className="selected-item-info">
                          <div className="info-block">
                            <span className="info-label">Series</span>
                            <span className="info-value">{se.sets}</span>
                          </div>
                          <div className="info-block">
                            <span className="info-label">Repeticiones</span>
                            <span className="info-value">
                              {se.repScheme && se.repScheme.length > 0
                                ? se.repScheme
                                : se.reps > 0
                                  ? `${se.reps}`
                                  : 'Fallo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {isEdit && (
            <div className="assign-section">
              <h4 className="assign-title">Asignar a Usuario</h4>
              <div className="assign-form">
                <select
                  className="form-select"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-assign" onClick={handleAssignUser}>
                  Asignar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateExerciseModal && (
        <div className="modal-overlay" onClick={() => setShowCreateExerciseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">NUEVO EJERCICIO</h3>
              <button type="button" className="modal-close" onClick={() => setShowCreateExerciseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateExercise}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del ejercicio</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newExerciseData.name}
                    onChange={(e) => setNewExerciseData({ ...newExerciseData, name: e.target.value })}
                    placeholder="Ej: Press de banca"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupo muscular</label>
                  <select
                    className="form-select"
                    value={newExerciseData.muscleGroup}
                    onChange={(e) => setNewExerciseData({ ...newExerciseData, muscleGroup: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar grupo</option>
                    {availableGroups.length > 0 ? (
                      availableGroups.map((group) => (
                        <option key={group.id} value={group.name}>{group.name}</option>
                      ))
                    ) : (
                      <option value="">No hay grupos disponibles</option>
                    )}
                  </select>
                </div>
                <div className="form-row new-exercise-reps-row">
                  <div className="form-group full-width-on-mobile">
                    <label className="form-label">Series</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newExerciseData.defaultSets}
                      onChange={(e) => {
                        const value = e.target.value;
                        const sets = Math.max(1, parseInt(value, 10) || 1);
                        setNewExerciseData({
                          ...newExerciseData,
                          defaultSets: value,
                          customReps: buildCustomReps(sets, newExerciseData.customReps),
                        });
                      }}
                    />
                  </div>
                  <div className="form-group full-width-on-mobile">
                    <label className="form-label">Tipo de repeticiones</label>
                    <select
                      className="form-select"
                      value={newExerciseData.repMode}
                      onChange={(e) => setNewExerciseData({ ...newExerciseData, repMode: e.target.value as 'uniform' | 'custom' })}
                    >
                      <option value="uniform">Todas iguales</option>
                      <option value="custom">Personalizadas</option>
                    </select>
                  </div>
                  {newExerciseData.repMode === 'uniform' ? (
                    <div className="form-group full-width" >
                      <label className="form-label">Repeticiones por serie</label>
                      <select
                        className="form-select"
                        value={newExerciseData.uniformRep}
                        onChange={(e) => setNewExerciseData({ ...newExerciseData, uniformRep: e.target.value })}
                      >
                        {REP_OPTIONS.map((rep) => (
                          <option key={`new-ex-uniform-${rep}`} value={rep}>{rep}</option>
                        ))}
                        <option value="FALLO">Al fallo</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group full-width">
                      <label className="form-label">Repeticiones personalizadas</label>
                      <div className="custom-reps-grid">
                        {Array.from({ length: Math.max(1, parseInt(newExerciseData.defaultSets, 10) || 1) }).map((_, index) => (
                          <select
                            key={`new-ex-custom-${index}`}
                            className="form-select"
                            value={newExerciseData.customReps[index] || ''}
                            onChange={(e) => {
                              const updated = [...newExerciseData.customReps];
                              updated[index] = e.target.value;
                              setNewExerciseData({ ...newExerciseData, customReps: updated });
                            }}
                          >
                            {REP_OPTIONS.map((rep) => (
                              <option key={`new-ex-custom-${index}-${rep}`} value={rep}>{rep}</option>
                            ))}
                            <option value="FALLO">Al fallo</option>
                          </select>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateExerciseModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Ejercicio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default RoutineForm;
