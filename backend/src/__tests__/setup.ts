import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.payment.deleteMany({});
  await prisma.userPlan.deleteMany({});
  await prisma.userRoutine.deleteMany({});
  await prisma.routineExercise.deleteMany({});
  await prisma.routineDay.deleteMany({});
  await prisma.routine.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.muscleGroup.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@gimnasio.com'
      }
    }
  });
  await prisma.plan.deleteMany({
    where: {
      name: {
        notIn: ['Básico', 'Premium', 'VIP']
      }
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
