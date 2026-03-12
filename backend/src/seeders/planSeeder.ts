import { Plan } from '../models';

const plans = [
  {
    name: 'Básico',
    description: 'Plan ideal para comenzar en el gimnasio',
    price: 15000,
    durationDays: 30,
    daysPerWeek: 2,
    benefits: ['Acceso a sala de musculación', 'Instructor de turno'],
  },
  {
    name: 'Standard',
    description: 'El plan más popular con buena relación precio-beneficio',
    price: 20000,
    durationDays: 30,
    daysPerWeek: 3,
    benefits: [
      'Acceso a sala de musculación',
      'Instructor de turno',
      'Clases grupales incluidas',
    ],
  },
  {
    name: 'Premium',
    description: 'Plan completo para quienes buscan resultados',
    price: 28000,
    durationDays: 30,
    daysPerWeek: 5,
    benefits: [
      'Acceso a sala de musculación',
      'Instructor personal incluido',
      'Clases grupales ilimitadas',
      'Evaluación física mensual',
    ],
  },
  {
    name: 'Anual',
    description: 'El mejor costo por mes, compromiso de un año',
    price: 240000,
    durationDays: 365,
    daysPerWeek: 7,
    benefits: [
      'Acceso total al gimnasio',
      'Instructor personal incluido',
      'Clases grupales ilimitadas',
      'Evaluación física mensual',
      'Descuentos en tienda',
    ],
  },
];

export const seedPlans = async () => {
  try {
    const count = await Plan.count();
    
    if (count === 0) {
      await Plan.bulkCreate(plans);
      console.log('✓ Planes base insertados:', plans.length);
    } else {
      console.log('✓ Planes ya existentes en la base de datos');
    }
  } catch (error) {
    console.error('Error al insertar planes:', error);
  }
};
