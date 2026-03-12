import { useEffect, useState } from 'react';
import { RefreshCcw, Timer as TimerIcon } from 'lucide-react';
import exerciseService from '../../../services/exerciseService';
import muscleGroupService from '../../../services/muscleGroupService';
import { Exercise, MuscleGroup } from '../../../types';
import '../routines/RoutineForm.css';
import { getMuscleIcon } from '../../../utils/muscleIcons';
import './Exercises.css';

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const DumbbellIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
    <path d="M17.5 21.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
    <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"></path>
    <path d="M19 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"></path>
    <path d="M12 3v18"></path>
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export const Exercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set<string>());
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingGroup, setEditingGroup] = useState<MuscleGroup | null>(null);
  const [exerciseFormData, setExerciseFormData] = useState({
    name: '',
    muscleGroup: '',
    defaultSets: '3',
    defaultReps: '10',
    description: '',
    repMode: 'uniform' as 'uniform' | 'custom',
    uniformRep: '10',
    customReps: ['10', '10', '10'],
  });
  const [groupFormData, setGroupFormData] = useState({ name: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadExercises();
    loadMuscleGroups();
  }, []);

  const loadExercises = async () => {
    try {
      const response = await exerciseService.getExercises();
      if (response.success && response.data) {
        setExercises(response.data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMuscleGroups = async () => {
    try {
      const response = await muscleGroupService.getGroups();
      if (response.success && response.data) {
        setMuscleGroups(response.data);
      }
    } catch (error) {
      console.error('Error loading muscle groups:', error);
    }
  };

  const REP_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExercise) {
        const basePayload = {
          name: exerciseFormData.name,
          muscleGroup: exerciseFormData.muscleGroup || undefined,
          defaultSets: parseInt(exerciseFormData.defaultSets),
          defaultReps: parseInt(exerciseFormData.uniformRep || exerciseFormData.defaultReps),
          description: exerciseFormData.description || undefined,
        } as Partial<Exercise> & { repScheme?: string };

        if (exerciseFormData.repMode === 'custom') {
          basePayload.repScheme = exerciseFormData.customReps.filter(Boolean).join(' - ');
        } else if ((exerciseFormData.uniformRep || '').toUpperCase() === 'FALLO') {
          basePayload.repScheme = 'Fallo';
        } else {
          basePayload.repScheme = undefined;
        }

        await exerciseService.updateExercise(editingExercise.id, basePayload);
        showToast('Ejercicio actualizado correctamente');
      } else {
        const basePayload = {
          name: exerciseFormData.name,
          muscleGroup: exerciseFormData.muscleGroup || undefined,
          defaultSets: parseInt(exerciseFormData.defaultSets),
          defaultReps: parseInt(exerciseFormData.uniformRep || exerciseFormData.defaultReps),
          description: exerciseFormData.description || undefined,
        } as Partial<Exercise> & { repScheme?: string };

        if (exerciseFormData.repMode === 'custom') {
          basePayload.repScheme = exerciseFormData.customReps.filter(Boolean).join(' - ');
        } else if ((exerciseFormData.uniformRep || '').toUpperCase() === 'FALLO') {
          basePayload.repScheme = 'Fallo';
        }

        await exerciseService.createExercise(basePayload);
        showToast('Ejercicio creado correctamente');
        if (exerciseFormData.muscleGroup) {
          setExpandedGroups(prev => new Set([...prev, exerciseFormData.muscleGroup]));
        }
      }
      closeModals();
      loadExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      showToast('Error al guardar ejercicio', 'error');
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupFormData.name.trim();
    if (!trimmed) return;

    try {
      if (editingGroup) {
        await muscleGroupService.updateGroup(editingGroup.id, trimmed);
        showToast('Grupo muscular actualizado correctamente');
      } else {
        await muscleGroupService.createGroup(trimmed);
        showToast('Grupo muscular creado correctamente');
        setExpandedGroups((prev) => new Set([...prev, trimmed]));
      }
      closeModals();
      loadMuscleGroups();
      loadExercises();
    } catch (error) {
      console.error('Error saving group:', error);
      showToast('Error al guardar grupo muscular', 'error');
    }
  };

  const handleDeleteExercise = async (id: number) => {
    setConfirmAction({
      type: 'delete-exercise',
      message: '¿Estás seguro de eliminar este ejercicio?',
      onConfirm: async () => {
        try {
          await exerciseService.deleteExercise(id);
          showToast('Ejercicio eliminado correctamente');
          loadExercises();
        } catch (error) {
          console.error('Error deleting exercise:', error);
          showToast('Error al eliminar ejercicio', 'error');
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteGroup = async (group: MuscleGroup) => {
    setConfirmAction({
      type: 'delete-group',
      message: `¿Eliminar el grupo "${group.name}"? \n Los ejercicios asociados se borrarán.`,
      onConfirm: async () => {
        try {
          await muscleGroupService.deleteGroup(group.id);
          setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.delete(group.name);
            return next;
          });
          showToast('Grupo muscular eliminado correctamente');
          loadExercises();
          loadMuscleGroups();
        } catch (error) {
          console.error('Error deleting group:', error);
          showToast('Error al eliminar grupo', 'error');
        }
      }
    });
    setShowConfirmModal(true);
  };

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    const repScheme = exercise.repScheme || '';
    const isUniformFailure = repScheme.toLowerCase().includes('fallo');
    const customValues = repScheme && !isUniformFailure
      ? repScheme.split(/[-/,]/).map((value) => value.trim()).filter(Boolean)
      : [];
    const useCustom = customValues.length > 1;
    setExerciseFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || '',
      defaultSets: String(exercise.defaultSets),
      defaultReps: String(exercise.defaultReps),
      description: exercise.description || '',
      repMode: useCustom ? 'custom' : 'uniform',
      uniformRep: useCustom ? String(exercise.defaultReps) : (isUniformFailure ? 'FALLO' : String(exercise.defaultReps)),
      customReps: useCustom ? customValues : Array.from({ length: exercise.defaultSets }).map((_, index) => customValues[index] || String(exercise.defaultReps)),
    });
    setShowExerciseForm(true);
  };

  const openEditGroup = (group: MuscleGroup) => {
    setEditingGroup(group);
    setGroupFormData({ name: group.name });
    setShowGroupForm(true);
  };

  const closeModals = () => {
    setShowExerciseForm(false);
    setShowGroupForm(false);
    setEditingExercise(null);
    setEditingGroup(null);
    setExerciseFormData({ name: '', muscleGroup: '', defaultSets: '3', defaultReps: '10', description: '', repMode: 'uniform', uniformRep: '10', customReps: ['10', '10', '10'] });
    setGroupFormData({ name: '' });
  };

  const getTagClass = (muscleGroup: string) => {
    const map: Record<string, string> = {
      'Pecho': 'pecho', 'Espalda': 'espalda', 'Hombros': 'hombros',
      'Bíceps': 'bíceps', 'Tríceps': 'tríceps', 'Piernas': 'piernas',
      'Abdomen': 'abdomen', 'General': 'general',
    };
    return map[muscleGroup] || 'general';
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="exercises-page">
      <div className="exercises-header">
        <h1 className="exercises-title">EJERCICIOS</h1>
        <p className="exercises-subtitle">{exercises.length} ejercicios disponibles en el catálogo</p>
      </div>

      <button className="add-exercise-btn" onClick={() => { setEditingExercise(null); setShowExerciseForm(true); }}>
        <PlusIcon /> Nuevo Ejercicio
      </button>

      <button className="add-muscle-group-btn" onClick={() => { setEditingGroup(null); setGroupFormData({ name: '' }); setShowGroupForm(true); }}>
        <PlusIcon /> Nuevo Grupo Muscular
      </button>

      {showExerciseForm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingExercise ? 'EDITAR EJERCICIO' : 'NUEVO EJERCICIO'}</h3>
              <button className="modal-close" onClick={closeModals}><XIcon /></button>
            </div>
            <form onSubmit={handleExerciseSubmit}>
              <div className="modal-body">
                <div className="modal-icon">
                  <DumbbellIcon />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre del ejercicio</label>
                  <input
                    type="text"
                    className="form-input"
                    value={exerciseFormData.name}
                    onChange={(e) => setExerciseFormData({ ...exerciseFormData, name: e.target.value })}
                    placeholder="Ej: Press de banca"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Grupo muscular</label>
                  <select
                    className="form-select"
                    value={exerciseFormData.muscleGroup}
                    onChange={(e) => setExerciseFormData({ ...exerciseFormData, muscleGroup: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar grupo</option>
                    {muscleGroups.length > 0 ? (
                      muscleGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
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
                      value={exerciseFormData.defaultSets}
                      onChange={(e) => {
                        const value = e.target.value;
                        const sets = Math.max(1, parseInt(value, 10) || 1);
                        const customReps = Array.from({ length: sets }).map((_, index) => exerciseFormData.customReps[index] || exerciseFormData.uniformRep || '10');
                        setExerciseFormData({ ...exerciseFormData, defaultSets: value, customReps });
                      }}
                    />
                  </div>
                  <div className="form-group full-width-on-mobile">
                    <label className="form-label">Tipo de repeticiones</label>
                    <select
                      className="form-select"
                      value={exerciseFormData.repMode}
                      onChange={(e) => setExerciseFormData({ ...exerciseFormData, repMode: e.target.value as 'uniform' | 'custom' })}
                    >
                      <option value="uniform">Todas iguales</option>
                      <option value="custom">Personalizadas</option>
                    </select>
                  </div>
                  {exerciseFormData.repMode === 'uniform' ? (
                    <div className="form-group full-width">
                      <label className="form-label">Repeticiones por serie</label>
                      <select
                        className="form-select"
                        value={exerciseFormData.uniformRep}
                        onChange={(e) => setExerciseFormData({ ...exerciseFormData, uniformRep: e.target.value })}
                      >
                        {REP_OPTIONS.map((rep) => (
                          <option key={`uniform-${rep}`} value={rep}>{rep}</option>
                        ))}
                        <option value="FALLO">Al fallo</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group full-width">
                      <label className="form-label">Repeticiones personalizadas</label>
                      <div className="custom-reps-grid">
                        {Array.from({ length: parseInt(exerciseFormData.defaultSets, 10) || 1 }).map((_, index) => (
                          <select
                            key={`custom-${index}`}
                            className="form-select"
                            value={exerciseFormData.customReps[index] || ''}
                            onChange={(e) => {
                              const newCustomReps = [...exerciseFormData.customReps];
                              newCustomReps[index] = e.target.value;
                              setExerciseFormData({ ...exerciseFormData, customReps: newCustomReps });
                            }}
                          >
                            {REP_OPTIONS.map((rep) => (
                              <option key={`custom-${index}-${rep}`} value={rep}>{rep}</option>
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
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingExercise ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGroupForm && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingGroup ? 'EDITAR GRUPO' : 'NUEVO GRUPO'}</h3>
              <button className="modal-close" onClick={closeModals}><XIcon /></button>
            </div>
            <form onSubmit={handleGroupSubmit}>
              <div className="modal-body">
                <div className="modal-icon">
                  <DumbbellIcon />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre del grupo muscular</label>
                  <input
                    type="text"
                    className="form-input"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    placeholder="Ej: Pecho, Espalda, Piernas..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingGroup ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {muscleGroups.map((group) => {
        const groupExercises = exercises.filter(e => e.muscleGroup === group.name);
        const isExpanded = expandedGroups.has(group.name);
        return (
        <div key={group.id} className={`muscle-group-card ${isExpanded ? 'expanded' : ''}`}>
          <button className="muscle-group-header" onClick={() => toggleGroup(group.name)}>
            <div className="muscle-group-info">
              <div className="muscle-group-icon">{getMuscleIcon(group.name)}</div>
              <div className="muscle-group-text">
                <h3>{group.name}</h3>
                <span className="muscle-group-count">
                  {groupExercises.length} ejercicios
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="muscle-group-actions" onClick={e => e.stopPropagation()}>
                <button className="edit-btn" onClick={() => openEditGroup(group)} title="Editar">
                  <EditIcon />
                </button>
                <button className="delete-btn" onClick={() => handleDeleteGroup(group)} title="Eliminar">
                  <TrashIcon />
                </button>
              </div>
              <span className="muscle-group-arrow"><ChevronIcon expanded={isExpanded} /></span>
            </div>
          </button>
          
          <div className="muscle-group-content">
            {groupExercises.length > 0 ? (
            <div className="exercises-grid">
              {groupExercises.map((exercise) => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-card-actions">
                    <button className="edit-btn" onClick={() => openEditExercise(exercise)} title="Editar">
                      <EditIcon />
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteExercise(exercise.id)} title="Eliminar">
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="exercise-header">
                    <div className="exercise-icon">{getMuscleIcon(exercise.muscleGroup || 'General')}</div>
                    <div className="exercise-info">
                      <div className="exercise-name">{exercise.name}</div>
                      <span className={`exercise-muscle-tag ${getTagClass(exercise.muscleGroup || 'General')}`}>
                        {exercise.muscleGroup}
                      </span>
                    </div>
                  </div>
                    <div className="exercise-stats">
                      <div className="exercise-stat">
                        <div className="exercise-stat-icon"><RefreshCcw size={16} /></div>
                        <div>
                          <div className="exercise-stat-value">{exercise.defaultSets}</div>
                          <div className="exercise-stat-label">series</div>
                        </div>
                      </div>
                      <div className="exercise-stat">
                        <div className="exercise-stat-icon"><TimerIcon size={16} /></div>
                        <div>
                          <div className="exercise-stat-value">
                            {exercise.repScheme && exercise.repScheme.length > 0
                              ? exercise.repScheme
                              : exercise.defaultReps}
                          </div>
                          <div className="exercise-stat-label">reps</div>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="empty-group">Aún no hay ejercicios en este grupo</div>
            )}
          </div>
        </div>
      );})}

      {muscleGroups.length === 0 && (
        <div className="panel-empty" style={{ marginTop: '2rem' }}>
          <p>Aún no hay grupos musculares creados</p>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="exercises-empty">
          <div className="exercises-empty-icon">
            <DumbbellIcon />
          </div>
          <h3>NO HAY EJERCICIOS</h3>
          <p>Crea tu primer ejercicio para comenzar</p>
        </div>
      )}

      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {showConfirmModal && confirmAction && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">CONFIRMAR ACCIÓN</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}><XIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e2e8f0', fontSize: '1.1rem', textAlign: 'center' }}>{confirmAction.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { confirmAction.onConfirm(); setShowConfirmModal(false); }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;
