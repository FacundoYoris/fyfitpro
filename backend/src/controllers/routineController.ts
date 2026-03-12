import { Request, Response } from 'express';
import prisma from '../config/database';

export const getRoutines = async (req: Request, res: Response) => {
  try {
    const routines = await prisma.routine.findMany({
      include: {
        routineDays: {
          include: {
            routineExercises: {
              include: { exercise: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: routines,
    });
  } catch (error) {
    console.error('Error en getRoutines:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutinas',
    });
  }
};

export const getRoutineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const routine = await prisma.routine.findUnique({
      where: { id: Number(id) },
      include: {
        routineDays: {
          include: {
            routineExercises: {
              include: { exercise: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada',
      });
    }

    res.json({
      success: true,
      data: routine,
    });
  } catch (error) {
    console.error('Error en getRoutineById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutina',
    });
  }
};

export const createRoutine = async (req: Request, res: Response) => {
  try {
    const { name, description, duration = 60, daysCount = 3, difficulty = 3, userId, days = [] } = req.body;
    const normalizedDifficulty = Math.min(5, Math.max(1, Number(difficulty) || 3));

    const routine = await prisma.routine.create({
      data: {
        name,
        description,
        duration,
        daysCount,
        difficulty: normalizedDifficulty,
        userId: userId || null,
        routineDays: days.length > 0 ? {
          create: days.map((day: any, dayIndex: number) => ({
            dayNumber: day.dayNumber,
            name: day.name,
            orderIndex: dayIndex,
            routineExercises: day.exercises?.length > 0 ? {
              create: day.exercises.map((ex: any, exIndex: number) => ({
                exerciseId: ex.exerciseId,
                orderIndex: exIndex,
                sets: ex.sets,
                reps: ex.reps,
                repScheme: ex.repScheme || null,
                observations: ex.observations || null,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        routineDays: {
          include: {
            routineExercises: {
              include: { exercise: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: routine,
    });
  } catch (error) {
    console.error('Error en createRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear rutina',
    });
  }
};

export const updateRoutine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, duration, daysCount, difficulty, days } = req.body;

    const routine = await prisma.routine.findUnique({ where: { id: Number(id) } });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada',
      });
    }

    if (days && days.length > 0) {
      await prisma.routineDay.deleteMany({
        where: { routineId: Number(id) },
      });

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const createdDay = await prisma.routineDay.create({
          data: {
            routineId: routine.id,
            dayNumber: day.dayNumber,
            name: day.name,
            orderIndex: dayIndex,
          },
        });

        if (day.exercises?.length > 0) {
          await prisma.routineExercise.createMany({
            data: day.exercises.map((ex: any, exIndex: number) => ({
              routineDayId: createdDay.id,
              exerciseId: ex.exerciseId,
              orderIndex: exIndex,
              sets: ex.sets,
              reps: ex.reps,
              repScheme: ex.repScheme || null,
              observations: ex.observations || null,
            })),
          });
        }
      }
    }

    const updatedRoutine = await prisma.routine.update({
      where: { id: Number(id) },
      data: {
        name: name || routine.name,
        description: description !== undefined ? description : routine.description,
        duration: duration !== undefined ? duration : routine.duration,
        daysCount: daysCount !== undefined ? daysCount : routine.daysCount,
        difficulty: difficulty !== undefined
          ? Math.min(5, Math.max(1, Number(difficulty)))
          : routine.difficulty,
      },
      include: {
        routineDays: {
          include: {
            routineExercises: {
              include: { exercise: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: updatedRoutine,
    });
  } catch (error) {
    console.error('Error en updateRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rutina',
    });
  }
};

export const deleteRoutine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const routine = await prisma.routine.findUnique({ where: { id: Number(id) } });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada',
      });
    }

    await prisma.routine.delete({ where: { id: Number(id) } });

    res.json({
      success: true,
      message: 'Rutina eliminada correctamente',
    });
  } catch (error) {
    console.error('Error en deleteRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar rutina',
    });
  }
};

export const assignRoutine = async (req: Request, res: Response) => {
  try {
    const { userId, routineId } = req.body;
    const adminId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const routine = await prisma.routine.findUnique({ where: { id: routineId } });
    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Rutina no encontrada',
      });
    }

    await prisma.userRoutine.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const userRoutine = await prisma.userRoutine.create({
      data: {
        userId,
        routineId,
        assignedBy: adminId,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: userRoutine,
    });
  } catch (error) {
    console.error('Error en assignRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar rutina',
    });
  }
};

export const getUserRoutines = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userRoutines = await prisma.userRoutine.findMany({
      where: { userId: Number(userId) },
      include: {
        routine: {
          include: {
            routineDays: {
              include: {
                routineExercises: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({
      success: true,
      data: userRoutines,
    });
  } catch (error) {
    console.error('Error en getUserRoutines:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutinas del usuario',
    });
  }
};

export const getUserActiveRoutine = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
      include: {
        routine: {
          include: {
            routineDays: {
              include: {
                routineExercises: {
                  include: { exercise: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: userRoutine || null,
    });
  } catch (error) {
    console.error('Error en getUserActiveRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutina del usuario',
    });
  }
};
