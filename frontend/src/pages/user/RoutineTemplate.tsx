import { useEffect, useState } from 'react';
import { ClipboardList, Dumbbell } from 'lucide-react';
import memberService from '../../services/memberService';
import { MemberRoutine, MemberRoutineDay } from '../../types';
import './Profile.css';

export const RoutineTemplate = () => {
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<MemberRoutine | null>(null);

  useEffect(() => {
    loadRoutine();
  }, []);

  const loadRoutine = async () => {
    try {
      const response = await memberService.getActiveRoutine();
      if (response.success && response.data) {
        setRoutine(response.data);
      }
    } catch (error) {
      console.error('Error loading routine template:', error);
    } finally {
      setLoading(false);
    }
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
      <section className="profile-panel">
        <header>
          <div className="panel-icon neutral"><ClipboardList size={18} /></div>
          <div>
            <h3>Plantilla de rutina</h3>
            <p>Vista completa de tus ejercicios por dia</p>
          </div>
        </header>

        {routine ? (
          <div className="routine-exercises-section">
            <h4>
              {routine.routine.name} · {routine.days.length} días
            </h4>
            {routine.days.map((day: MemberRoutineDay) => (
              <div key={day.id} className="routine-day-block">
                <div className="routine-day-header">
                  <span>{day.name}</span>
                  <span>{day.routineExercises.length} ejercicios</span>
                </div>
                <ul className="exercise-list">
                  {day.routineExercises.map((exercise) => (
                    <li key={exercise.id} className="exercise-item">
                      <span className="exercise-name">
                        <Dumbbell size={14} /> {exercise.exercise.name}
                      </span>
                      <span className="exercise-sets">
                        {exercise.sets} series · {exercise.repScheme && exercise.repScheme.trim().length > 0 ? exercise.repScheme : `${exercise.reps} reps`}
                      </span>
                      {exercise.observations ? (
                        <span className="exercise-weight">{exercise.observations}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-routines">
            <p>No tienes rutinas asignadas</p>
            <p className="empty-hint">Contacta al administrador para que te asigne una rutina.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RoutineTemplate;
