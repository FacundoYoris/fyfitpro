import { Exercise } from '../models';

const exercises = [
  { name: 'Press de banca', muscleGroup: 'Pecho', defaultSets: 4, defaultReps: 10 },
  { name: 'Press inclinado', muscleGroup: 'Pecho', defaultSets: 3, defaultReps: 10 },
  { name: 'Pullover', muscleGroup: 'Pecho', defaultSets: 3, defaultReps: 12 },
  { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho', defaultSets: 3, defaultReps: 12 },
  { name: 'Fondos en paralela', muscleGroup: 'Pecho', defaultSets: 3, defaultReps: 10 },
  
  { name: 'Peso muerto', muscleGroup: 'Espalda', defaultSets: 4, defaultReps: 8 },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda', defaultSets: 4, defaultReps: 10 },
  { name: 'Remo con barra', muscleGroup: 'Espalda', defaultSets: 4, defaultReps: 10 },
  { name: 'Remo con mancuerna', muscleGroup: 'Espalda', defaultSets: 3, defaultReps: 10 },
  { name: 'Polea alta', muscleGroup: 'Espalda', defaultSets: 3, defaultReps: 12 },
  
  { name: 'Press militar', muscleGroup: 'Hombros', defaultSets: 4, defaultReps: 10 },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombros', defaultSets: 3, defaultReps: 15 },
  { name: 'Elevaciones frontales', muscleGroup: 'Hombros', defaultSets: 3, defaultReps: 12 },
  { name: 'Face pull', muscleGroup: 'Hombros', defaultSets: 3, defaultReps: 15 },
  { name: 'Press Arnold', muscleGroup: 'Hombros', defaultSets: 3, defaultReps: 10 },
  
  { name: 'Curl con barra', muscleGroup: 'Bíceps', defaultSets: 3, defaultReps: 12 },
  { name: 'Curl con mancuernas', muscleGroup: 'Bíceps', defaultSets: 3, defaultReps: 12 },
  { name: 'Curl martillo', muscleGroup: 'Bíceps', defaultSets: 3, defaultReps: 12 },
  { name: 'Curl en banco inclinado', muscleGroup: 'Bíceps', defaultSets: 3, defaultReps: 10 },
  
  { name: 'Extensiones en polea', muscleGroup: 'Tríceps', defaultSets: 3, defaultReps: 12 },
  { name: 'Fondos en banco', muscleGroup: 'Tríceps', defaultSets: 3, defaultReps: 10 },
  { name: 'Press francés', muscleGroup: 'Tríceps', defaultSets: 3, defaultReps: 10 },
  { name: 'Patada de tríceps', muscleGroup: 'Tríceps', defaultSets: 3, defaultReps: 12 },
  
  { name: 'Sentadilla', muscleGroup: 'Piernas', defaultSets: 4, defaultReps: 10 },
  { name: 'Prensa', muscleGroup: 'Piernas', defaultSets: 4, defaultReps: 12 },
  { name: 'Peso rumano', muscleGroup: 'Piernas', defaultSets: 3, defaultReps: 10 },
  { name: 'Extensiones de cuadriceps', muscleGroup: 'Piernas', defaultSets: 3, defaultReps: 12 },
  { name: 'Curl de isquiotibiales', muscleGroup: 'Piernas', defaultSets: 3, defaultReps: 12 },
  { name: 'Elevación de talones', muscleGroup: 'Piernas', defaultSets: 3, defaultReps: 15 },
  { name: 'Zancadas', muscleGroup: 'Piernas', defaultSets: 3, defaultReps: 10 },
  
  { name: 'Crunch', muscleGroup: 'Abdomen', defaultSets: 3, defaultReps: 20 },
  { name: 'Elevación de piernas', muscleGroup: 'Abdomen', defaultSets: 3, defaultReps: 15 },
  { name: 'Plancha', muscleGroup: 'Abdomen', defaultSets: 3, defaultReps: 60 },
  { name: 'Russian twist', muscleGroup: 'Abdomen', defaultSets: 3, defaultReps: 20 },
  { name: 'Mountain climber', muscleGroup: 'Abdomen', defaultSets: 3, defaultReps: 20 },
  
  { name: 'Dominadas', muscleGroup: 'General', defaultSets: 3, defaultReps: 8 },
  { name: 'Burpees', muscleGroup: 'General', defaultSets: 3, defaultReps: 10 },
  { name: 'Saltos al cajón', muscleGroup: 'General', defaultSets: 3, defaultReps: 12 },
];

export const seedExercises = async () => {
  try {
    const count = await Exercise.count();
    
    if (count === 0) {
      await Exercise.bulkCreate(exercises);
      console.log('✓ Ejercicios base insertados:', exercises.length);
    } else {
      console.log('✓ Ejercicios ya existentes en la base de datos');
    }
  } catch (error) {
    console.error('Error al insertar ejercicios:', error);
  }
};
