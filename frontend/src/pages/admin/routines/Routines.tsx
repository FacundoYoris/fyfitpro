import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import routineService from '../../../services/routineService';
import { Routine } from '../../../types';
import './Routines.css';

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
    <path d="M17.5 21.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
    <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"></path>
    <path d="M19 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"></path>
    <path d="M12 3v18"></path>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`routine-star ${filled ? 'filled' : ''}`}
  >
    <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const Routines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const response = await routineService.getRoutines();
      if (response.success && response.data) {
        setRoutines(response.data);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async (id: number) => {
    setConfirmAction({
      type: 'delete-routine',
      message: '¿Estás seguro de eliminar esta rutina?',
      onConfirm: async () => {
        try {
          await routineService.deleteRoutine(id);
          showToast('Rutina eliminada correctamente');
          loadRoutines();
        } catch (error) {
          console.error('Error deleting routine:', error);
          showToast('Error al eliminar rutina', 'error');
        }
      }
    });
    setShowConfirmModal(true);
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes || minutes <= 0) return '-';
    return minutes;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="routines-page">
      <div className="routines-header">
        <h1 className="routines-title">RUTINAS</h1>
        <p className="routines-subtitle">{routines.length} rutinas disponibles</p>
      </div>

      <Link to="/admin/routines/new" className="add-routine-btn">
        <PlusIcon /> Nueva Rutina
      </Link>

      {routines.length > 0 ? (
        <div className="routines-grid">
          {routines.map((routine) => {
            const difficultyLevel = routine.difficulty ? Math.min(5, Math.max(1, routine.difficulty)) : 3;
            return (
              <div key={routine.id} className="routine-card">
              <div className="routine-card-header">
                <div className="routine-card-title">
                  <h3 className="routine-name">{routine.name}</h3>
                  <div className="routine-difficulty">
                    <div className="routine-difficulty-stars">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <StarIcon key={starIndex} filled={starIndex < difficultyLevel} />
                      ))}
                    </div>
                    <span className="routine-difficulty-label">Nivel {difficultyLevel}</span>
                  </div>
                </div>
                <div className="routine-card-actions">
                  <button className="edit-btn" onClick={() => navigate(`/admin/routines/${routine.id}`)} title="Editar">
                    <EditIcon />
                  </button>
                  <button className="view-btn" onClick={() => setSelectedRoutine(routine)} title="Ver">
                    <EyeIcon />
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteRoutine(routine.id)} title="Eliminar">
                    <TrashIcon />
                  </button>
                </div>
              </div>
              
              <div className="routine-card-body">
                <p className="routine-description">
                  {routine.description ?? ''}
                </p>

                <div className="routine-stats">
                  <div className="routine-stat">
                    <div className="routine-stat-icon exercises">
                      <DumbbellIcon />
                    </div>
                    <div className="routine-stat-content">
                      <span className="routine-stat-value">{(routine as any).routineDays?.length || 0}</span>
                      <span className="routine-stat-label">días</span>
                    </div>
                  </div>
                  <div className="routine-stat">
                    <div className="routine-stat-icon duration">
                      <ClockIcon />
                    </div>
                    <div className="routine-stat-content">
                      <span className="routine-stat-value">{formatDuration((routine as any).duration)}</span>
                      <span className="routine-stat-label">min</span>
                    </div>
                  </div>
                </div>

                <div className="routine-meta">
                  <span>Creada: {new Date(routine.createdAt).toLocaleDateString('es-AR')}</span>
                </div>
              </div>

              <div className="routine-card-footer">
                <button className="btn-view-full" onClick={() => setSelectedRoutine(routine)}>
                  <EyeIcon /> Ver Rutina Completa
                </button>
              </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="routines-empty">
          <div className="routines-empty-icon">
            <DumbbellIcon />
          </div>
          <h3>NO HAY RUTINAS</h3>
          <p>Crea tu primera rutina para comenzar</p>
        </div>
      )}

      {selectedRoutine && (
        <div className="modal-overlay" onClick={() => setSelectedRoutine(null)}>
          <div className="modal routine-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedRoutine.name}</h3>
              <button className="modal-close" onClick={() => setSelectedRoutine(null)}><XIcon /></button>
            </div>
            <div className="modal-body">
              {selectedRoutine.description && (
                <p className="routine-view-description">{selectedRoutine.description}</p>
              )}
              <div className="routine-view-days">
                {(selectedRoutine as any).routineDays?.map((day: any, index: number) => (
                  <div key={index} className="routine-view-day">
                    <h4 className="routine-view-day-title">
                      <span className="day-number">{day.dayNumber}</span>
                      {day.name}
                    </h4>
                    <div className="routine-view-exercises">
                      {day.routineExercises?.length > 0 ? (
                        day.routineExercises.map((ex: any, exIndex: number) => (
                          <div key={exIndex} className="routine-view-exercise">
                            <span className="exercise-name">{ex.exercise?.name}</span>
                            <span className="exercise-details">
                              {ex.repScheme?.length ? ex.repScheme : `${ex.sets} series × ${ex.reps} reps`}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="no-exercises">Sin ejercicios</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRoutine(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => { navigate(`/admin/routines/${selectedRoutine.id}`); setSelectedRoutine(null); }}>
                Editar Rutina
              </button>
            </div>
          </div>
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

export default Routines;
