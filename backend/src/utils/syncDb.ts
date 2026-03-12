import prisma from '../config/database';
import bcrypt from 'bcryptjs';

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

const baseMuscleGroups = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Abdomen', 'Glúteos', 'General', 'Cardio'];

const muscleGroupNames = Array.from(new Set([...baseMuscleGroups, ...exercises.map((exercise) => exercise.muscleGroup)]));

const plans = [
  { name: 'Básico', description: 'Plan ideal para comenzar en el gimnasio', price: 15000, durationDays: 30, daysPerWeek: 2, benefits: 'Acceso a sala de musculación|Instructor de turno' },
  { name: 'Standard', description: 'El plan más popular con buena relación precio-beneficio', price: 20000, durationDays: 30, daysPerWeek: 3, benefits: 'Acceso a sala de musculación|Instructor de turno|Clases grupales incluidas' },
  { name: 'Premium', description: 'Plan completo para quienes buscan resultados', price: 28000, durationDays: 30, daysPerWeek: 5, benefits: 'Acceso a sala de musculación|Instructor personal incluido|Clases grupales ilimitadas|Evaluación física mensual' },
  { name: 'Anual', description: 'El mejor costo por mes, compromiso de un año', price: 240000, durationDays: 365, daysPerWeek: 7, benefits: 'Acceso total al gimnasio|Instructor personal incluido|Clases grupas ilimitadas|Evaluación física mensual|Descuentos en tienda' },
];

const seedDatabase = async () => {
  try {
    console.log('🔄 Iniciando seed de datos...');

    const existingGroups = await prisma.muscleGroup.findMany({ select: { name: true } });
    const existingNames = new Set(existingGroups.map((group) => group.name));
    const missingGroups = muscleGroupNames.filter((name) => !existingNames.has(name));

    if (missingGroups.length > 0) {
      await prisma.muscleGroup.createMany({ data: missingGroups.map((name) => ({ name })) });
    }
    console.log(`✓ Grupos musculares disponibles: ${muscleGroupNames.length} (nuevos: ${missingGroups.length})`);

    const exerciseCount = await prisma.exercise.count();
    if (exerciseCount === 0) {
      await prisma.exercise.createMany({ data: exercises });
      console.log('✓ Ejercicios insertados:', exercises.length);
    } else {
      console.log('✓ Ejercicios ya existentes');
    }

    const planCount = await prisma.plan.count();
    if (planCount === 0) {
      await prisma.plan.createMany({ data: plans });
      console.log('✓ Planes insertados:', plans.length);
    } else {
      console.log('✓ Planes ya existentes');
    }

    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@gimnasio.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@gimnasio.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Gimnasio',
          role: 'admin',
        },
      });
      console.log('✓ Usuario admin creado: admin@gimnasio.com / admin123');
    } else {
      console.log('✓ Usuario admin ya existe');
    }

    console.log('\n🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  }
};

seedDatabase();
