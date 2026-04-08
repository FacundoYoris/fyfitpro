import { Request, Response } from 'express';
import prisma from '../config/database';

export const getActiveRoutine = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
      include: {
        routine: {
          include: {
            routineDays: {
              orderBy: { orderIndex: 'asc' },
              include: {
                routineExercises: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    exercise: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userRoutine) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const routine = userRoutine.routine;
    
    const exerciseLogs = await prisma.exerciseLog.findMany({
      where: {
        session: {
          userId,
          routineId: routine.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const lastWeights: Record<number, { weight: number; date: string }> = {};
    for (const log of exerciseLogs) {
      if (!lastWeights[log.exerciseId] || new Date(log.createdAt) > new Date(lastWeights[log.exerciseId].date)) {
        lastWeights[log.exerciseId] = {
          weight: log.weight || 0,
          date: log.createdAt.toISOString(),
        };
      }
    }

    const daysWithLastWeights = routine.routineDays.map((day) => ({
      ...day,
      exercises: day.routineExercises.map((ex) => ({
        ...ex,
        lastWeight: lastWeights[ex.exerciseId]?.weight || null,
        lastWeightDate: lastWeights[ex.exerciseId]?.date || null,
      })),
    }));

    res.json({
      success: true,
      data: {
        id: userRoutine.id,
        routine: {
          id: routine.id,
          name: routine.name,
          description: routine.description,
          duration: routine.duration,
          daysCount: routine.daysCount,
        },
        assignedAt: userRoutine.assignedAt,
        days: daysWithLastWeights,
      },
    });
  } catch (error) {
    console.error('Error en getActiveRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rutina activa',
    });
  }
};

export const getCalendar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { month, year } = req.query;

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
      include: {
        routine: {
          include: {
            routineDays: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!userRoutine) {
      return res.json({
        success: true,
        data: {
          days: [],
          routineDays: [],
        },
      });
    }

    const routine = userRoutine.routine;
    const daysCount = routine.routineDays.length;

    const TRAINING_DAYS_BY_FREQUENCY: Record<number, number[]> = {
      1: [1],
      2: [1, 4],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6],
    };

    const activeWeekDays =
      TRAINING_DAYS_BY_FREQUENCY[daysCount] ?? TRAINING_DAYS_BY_FREQUENCY[3];

    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    const startDate = new Date(monthStart);
    const startDayOfWeek = startDate.getDay();
    const startDiff = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    startDate.setDate(startDate.getDate() + startDiff);

    const endDate = new Date(monthEnd);
    const endDayOfWeek = endDate.getDay();
    const endDiff = endDayOfWeek === 0 ? -1 : 6 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + endDiff);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        sessionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        routineDay: true,
        exerciseLogs: true,
      },
    });

    const sessionsByDate: Record<string, typeof sessions[0]> = {};
    sessions.forEach((session) => {
      const dateKey = session.sessionDate.toISOString().split('T')[0];
      sessionsByDate[dateKey] = session;
    });

    const calendarDays = [];

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dayOfWeek = cursor.getDay();

      if (dayOfWeek !== 0) {
        const weekDayNumber = dayOfWeek;
        const dayPosition = activeWeekDays.indexOf(weekDayNumber);
        const isActiveDay = dayPosition !== -1;

        const routineDay = isActiveDay ? routine.routineDays[dayPosition] : null;
        const dateKey = cursor.toISOString().split('T')[0];
        const session = sessionsByDate[dateKey] || null;

        calendarDays.push({
          date: cursor.toISOString(),
          day: cursor.getDate(),
          weekDayNumber,
          isOtherMonth: cursor.getMonth() !== currentMonth - 1,
          cycleDayNumber: isActiveDay ? dayPosition + 1 : null,
          routineDay: routineDay
            ? {
                id: routineDay.id,
                name: routineDay.name,
                dayNumber: routineDay.dayNumber,
              }
            : null,
          session: session
            ? {
                id: session.id,
                status: session.status,
                notes: session.notes,
                exerciseCount: session.exerciseLogs.length,
              }
            : null,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        days: calendarDays,
        routineDays: routine.routineDays.map((rd) => ({
          id: rd.id,
          name: rd.name,
          dayNumber: rd.dayNumber,
        })),
      },
    });
  } catch (error) {
    console.error('Error en getCalendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calendario',
    });
  }
};

export const saveWorkoutLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date, routineDayId, entries, status, notes } = req.body;

    const sessionDate = new Date(date);

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
    });

    if (!userRoutine) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una rutina activa',
      });
    }

    let session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        sessionDate: {
          gte: new Date(sessionDate.setHours(0, 0, 0, 0)),
          lt: new Date(sessionDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (session) {
      await prisma.exerciseLog.deleteMany({
        where: { sessionId: session.id },
      });

      session = await prisma.workoutSession.update({
        where: { id: session.id },
        data: {
          routineDayId,
          status: status || 'completed',
          notes: notes || null,
        },
      });
    } else {
      session = await prisma.workoutSession.create({
        data: {
          userId,
          routineId: userRoutine.routineId,
          routineDayId,
          sessionDate: new Date(date),
          status: status || 'completed',
          notes: notes || null,
        },
      });
    }

    if (entries && entries.length > 0) {
      const exerciseLogsData = [];
      for (const entry of entries) {
        if (entry.sets && entry.sets.length > 0) {
          for (const set of entry.sets) {
            exerciseLogsData.push({
              sessionId: session.id,
              exerciseId: entry.exerciseId,
              setNumber: set.setNumber,
              weight: set.weight || null,
              reps: set.reps || null,
              notes: set.notes || null,
            });
          }
        }
      }

      if (exerciseLogsData.length > 0) {
        await prisma.exerciseLog.createMany({
          data: exerciseLogsData,
        });
      }
    }

    const updatedLogs = await prisma.exerciseLog.findMany({
      where: { sessionId: session.id },
      orderBy: { exerciseId: 'asc' },
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          date: session.sessionDate,
          status: session.status,
          notes: session.notes,
        },
        logs: updatedLogs,
      },
    });
  } catch (error) {
    console.error('Error en saveWorkoutLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar registros',
    });
  }
};

export const getExerciseHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { exerciseId } = req.query;

    const whereClause: any = {
      session: { userId },
    };

    if (exerciseId) {
      whereClause.exerciseId = Number(exerciseId);
    }

    const logs = await prisma.exerciseLog.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            routineDay: true,
          },
        },
        exercise: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const historyByExercise: Record<number, any[]> = {};
    for (const log of logs) {
      if (!historyByExercise[log.exerciseId]) {
        historyByExercise[log.exerciseId] = [];
      }
      historyByExercise[log.exerciseId].push({
        id: log.id,
        sessionDate: log.session.sessionDate,
        routineDayName: log.session.routineDay?.name,
        setNumber: log.setNumber,
        weight: log.weight,
        reps: log.reps,
        notes: log.notes,
      });
    }

    res.json({
      success: true,
      data: historyByExercise,
    });
  } catch (error) {
    console.error('Error en getExerciseHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
    });
  }
};

export const getLastWeights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
    });

    if (!userRoutine) {
      return res.json({
        success: true,
        data: {},
      });
    }

    const logs = await prisma.exerciseLog.findMany({
      where: {
        session: {
          userId,
          routineId: userRoutine.routineId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const lastWeights: Record<number, { weight: number; date: string; reps: number }> = {};
    for (const log of logs) {
      if (log.weight !== null && log.weight > 0) {
        if (!lastWeights[log.exerciseId]) {
          lastWeights[log.exerciseId] = {
            weight: log.weight,
            date: log.createdAt.toISOString(),
            reps: log.reps || 0,
          };
        }
      }
    }

    res.json({
      success: true,
      data: lastWeights,
    });
  } catch (error) {
    console.error('Error en getLastWeights:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener últimos pesos',
    });
  }
};
