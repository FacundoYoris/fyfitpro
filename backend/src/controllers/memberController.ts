import { Request, Response } from 'express';
import prisma from '../config/database';

const TRAINING_DAYS_BY_FREQUENCY: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const roundToOne = (value: number) => Math.round(value * 10) / 10;

const getWeightLogDelegate = () => (prisma as any).weightLog;

const buildScheduledDates = (from: Date, to: Date, activeWeekDays: number[]) => {
  const dates: string[] = [];
  const cursor = startOfDay(from);
  const end = endOfDay(to);

  while (cursor <= end) {
    const weekDay = cursor.getDay();
    if (weekDay !== 0 && activeWeekDays.includes(weekDay)) {
      dates.push(toDateKey(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const getWeekStartKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
};

const calculateStreaks = (scheduledDates: string[], completedDates: Set<string>) => {
  let bestStreak = 0;
  let runningStreak = 0;

  for (const dateKey of scheduledDates) {
    if (completedDates.has(dateKey)) {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let index = scheduledDates.length - 1; index >= 0; index -= 1) {
    if (completedDates.has(scheduledDates[index])) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    bestStreak,
  };
};

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
              include: {
                routineExercises: {
                  include: {
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                        muscleGroup: true,
                      },
                    },
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
        data: {
          days: [],
          routineDays: [],
        },
      });
    }

    const routine = userRoutine.routine;
    const daysCount = routine.routineDays.length;

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
        routineId: routine.id,
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
        const uniqueExercisesCount = session
          ? new Set(session.exerciseLogs.map((log) => log.exerciseId)).size
          : 0;

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
                exerciseCount: uniqueExercisesCount,
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
        routineId: userRoutine.routineId,
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

export const getWorkoutSessionByDate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es inválida',
      });
    }

    const dayStart = new Date(parsedDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(parsedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const userRoutine = await prisma.userRoutine.findFirst({
      where: { userId, isActive: true },
    });

    if (!userRoutine) {
      return res.json({
        success: true,
        data: {
          session: null,
          logs: [],
        },
      });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        userId,
        routineId: userRoutine.routineId,
        sessionDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        exerciseLogs: {
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' },
          ],
        },
      },
    });

    if (!session) {
      return res.json({
        success: true,
        data: {
          session: null,
          logs: [],
        },
      });
    }

    return res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          date: session.sessionDate,
          status: session.status,
          notes: session.notes,
        },
        logs: session.exerciseLogs,
      },
    });
  } catch (error) {
    console.error('Error en getWorkoutSessionByDate:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesión del día',
    });
  }
};

export const getWorkoutSessionById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = Number(req.params.sessionId);

    if (Number.isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'El ID de sesión es inválido',
      });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        exerciseLogs: {
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' },
          ],
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
      });
    }

    return res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          date: session.sessionDate,
          status: session.status,
          notes: session.notes,
        },
        logs: session.exerciseLogs,
      },
    });
  } catch (error) {
    console.error('Error en getWorkoutSessionById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesión',
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

export const getProgressStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const queryExerciseId = Number(req.query.exerciseId);
    const period = typeof req.query.period === 'string' ? req.query.period : 'month';
    const routineFilter = typeof req.query.routineFilter === 'string' ? req.query.routineFilter : 'active';
    const muscleGroupFilter = typeof req.query.muscleGroup === 'string' && req.query.muscleGroup.trim().length > 0
      ? req.query.muscleGroup.trim()
      : null;

    const now = new Date();
    const currentWeekStart = startOfDay(new Date(now));
    const currentDay = currentWeekStart.getDay();
    const weekOffset = currentDay === 0 ? 6 : currentDay - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - weekOffset);

    const defaultStartDateByPeriod: Record<string, Date> = {
      week: currentWeekStart,
      month: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      '3months': startOfDay(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      year: startOfDay(new Date(now.getFullYear(), 0, 1)),
      all: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      custom: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    };

    const defaultStartDate = defaultStartDateByPeriod[period] || defaultStartDateByPeriod.month;
    const defaultEndDate = endOfDay(now);

    const startDateParam = typeof req.query.startDate === 'string' ? req.query.startDate : null;
    const endDateParam = typeof req.query.endDate === 'string' ? req.query.endDate : null;

    const parsedStartDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const parsedEndDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Rango de fechas inválido',
      });
    }

    let analysisStartDate = startOfDay(parsedStartDate);
    const analysisEndDateRaw = endOfDay(parsedEndDate);
    const analysisEndDate = analysisEndDateRaw > defaultEndDate ? defaultEndDate : analysisEndDateRaw;

    if (analysisStartDate > analysisEndDate) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
      });
    }

    const userRoutines = await prisma.userRoutine.findMany({
      where: { userId },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            routineDays: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    const activeRoutineRecord = userRoutines.find((item) => item.isActive) || null;
    const routineById = new Map<number, typeof userRoutines[number]>();
    for (const routineRecord of userRoutines) {
      if (!routineById.has(routineRecord.routineId)) {
        routineById.set(routineRecord.routineId, routineRecord);
      }
    }

    const uniqueRoutines = Array.from(routineById.values());

    let selectedRoutineIds: number[] | null = null;
    let selectedRoutineDaysCount = 0;

    if (routineFilter === 'active') {
      selectedRoutineIds = activeRoutineRecord ? [activeRoutineRecord.routineId] : [];
      selectedRoutineDaysCount = activeRoutineRecord?.routine.routineDays.length || 0;
    } else if (routineFilter === 'all') {
      selectedRoutineIds = null;
      selectedRoutineDaysCount = activeRoutineRecord?.routine.routineDays.length || 0;
    } else if (routineFilter.startsWith('routine:')) {
      const routineId = Number(routineFilter.replace('routine:', ''));
      if (!Number.isNaN(routineId)) {
        const selectedRoutineRecord = uniqueRoutines.find((item) => item.routineId === routineId) || null;
        selectedRoutineIds = selectedRoutineRecord ? [selectedRoutineRecord.routineId] : [];
        selectedRoutineDaysCount = selectedRoutineRecord?.routine.routineDays.length || 0;
      } else {
        selectedRoutineIds = activeRoutineRecord ? [activeRoutineRecord.routineId] : [];
        selectedRoutineDaysCount = activeRoutineRecord?.routine.routineDays.length || 0;
      }
    } else {
      selectedRoutineIds = activeRoutineRecord ? [activeRoutineRecord.routineId] : [];
      selectedRoutineDaysCount = activeRoutineRecord?.routine.routineDays.length || 0;
    }

    if (period === 'all') {
      const firstSession = await prisma.workoutSession.findFirst({
        where: {
          userId,
          ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
        },
        orderBy: {
          sessionDate: 'asc',
        },
        select: {
          sessionDate: true,
        },
      });

      if (firstSession?.sessionDate) {
        analysisStartDate = startOfDay(firstSession.sessionDate);
      }
    }

    const routineOptions = [
      { value: 'active', label: 'Rutina activa', enabled: !!activeRoutineRecord },
      { value: 'all', label: 'Todas', enabled: userRoutines.length > 0 },
      ...uniqueRoutines.map((item) => ({
        value: `routine:${item.routineId}`,
        label: item.isActive ? `${item.routine.name} (Activa)` : item.routine.name,
        enabled: true,
      })),
    ];

    const completedLogs = await prisma.exerciseLog.findMany({
      where: {
        session: {
          userId,
          status: 'completed',
          sessionDate: {
            gte: analysisStartDate,
            lte: analysisEndDate,
          },
          ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
        },
        ...(muscleGroupFilter ? { exercise: { muscleGroup: muscleGroupFilter } } : {}),
      },
      include: {
        session: {
          select: {
            id: true,
            sessionDate: true,
          },
        },
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroup: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const rangeDays = Math.max(
      1,
      Math.floor((analysisEndDate.getTime() - analysisStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const previousPeriodEnd = endOfDay(new Date(analysisStartDate.getTime() - (1000 * 60 * 60 * 24)));
    const previousPeriodStart = startOfDay(new Date(previousPeriodEnd.getTime() - ((rangeDays - 1) * 1000 * 60 * 60 * 24)));

    const previousLogs = await prisma.exerciseLog.findMany({
      where: {
        session: {
          userId,
          status: 'completed',
          sessionDate: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
          ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
        },
        ...(muscleGroupFilter ? { exercise: { muscleGroup: muscleGroupFilter } } : {}),
      },
      include: {
        session: {
          select: {
            id: true,
          },
        },
        exercise: {
          select: {
            id: true,
            name: true,
            muscleGroup: true,
          },
        },
      },
    });

    const exerciseMap = new Map<number, {
      id: number;
      name: string;
      muscleGroup: string | null;
      maxWeight: number;
      lastWeight: number;
      lastDate: string;
      dates: Set<string>;
    }>();

    for (const log of completedLogs) {
      if (log.weight === null || log.weight <= 0) {
        continue;
      }

      if (!log.exercise) {
        continue;
      }

      const dateKey = toDateKey(log.session.sessionDate);
      const current = exerciseMap.get(log.exerciseId);

      if (!current) {
        exerciseMap.set(log.exerciseId, {
          id: log.exercise.id,
          name: log.exercise.name,
          muscleGroup: log.exercise.muscleGroup,
          maxWeight: log.weight,
          lastWeight: log.weight,
          lastDate: dateKey,
          dates: new Set([dateKey]),
        });
        continue;
      }

      current.maxWeight = Math.max(current.maxWeight, log.weight);
      if (dateKey >= current.lastDate) {
        current.lastDate = dateKey;
        current.lastWeight = log.weight;
      }
      current.dates.add(dateKey);
    }

    const routineExercisesMap = new Map<number, {
      id: number;
      name: string;
      muscleGroup: string | null;
    }>();

    const routineIdsForExercises = selectedRoutineIds
      ? selectedRoutineIds
      : Array.from(new Set(userRoutines.map((item) => item.routineId)));

    if (routineIdsForExercises.length > 0) {
      const routineExerciseDefinitions = await prisma.routineExercise.findMany({
        where: {
          routineDay: {
            routineId: { in: routineIdsForExercises },
          },
          ...(muscleGroupFilter ? { exercise: { muscleGroup: muscleGroupFilter } } : {}),
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              muscleGroup: true,
            },
          },
        },
      });

      for (const routineExercise of routineExerciseDefinitions) {
        routineExercisesMap.set(routineExercise.exercise.id, {
          id: routineExercise.exercise.id,
          name: routineExercise.exercise.name,
          muscleGroup: routineExercise.exercise.muscleGroup,
        });
      }
    }

    const combinedExerciseIds = new Set<number>([
      ...Array.from(routineExercisesMap.keys()),
      ...Array.from(exerciseMap.keys()),
    ]);

    const exercises = Array.from(combinedExerciseIds)
      .map((exerciseId) => {
        const fromLogs = exerciseMap.get(exerciseId);
        const fromRoutine = routineExercisesMap.get(exerciseId);

        return {
          id: exerciseId,
          name: fromLogs?.name || fromRoutine?.name || 'Ejercicio',
          muscleGroup: fromLogs?.muscleGroup ?? fromRoutine?.muscleGroup ?? null,
          maxWeight: fromLogs ? roundToOne(fromLogs.maxWeight) : 0,
          lastWeight: fromLogs ? roundToOne(fromLogs.lastWeight) : 0,
          sessionsWithLogs: fromLogs ? fromLogs.dates.size : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const selectedExerciseId = Number.isNaN(queryExerciseId)
      ? exercises[0]?.id ?? null
      : (exercises.find((exercise) => exercise.id === queryExerciseId)?.id ?? exercises[0]?.id ?? null);

    const selectedExerciseLogs = selectedExerciseId
      ? completedLogs.filter((log) => log.exerciseId === selectedExerciseId && log.weight !== null && log.weight > 0 && log.reps !== null && log.reps > 0)
      : [];

    const progressionMap = new Map<string, {
      date: string;
      reps: number;
      maxWeight: number;
      volume: number;
    }>();

    for (const log of selectedExerciseLogs) {
      const reps = log.reps || 0;
      const weight = log.weight || 0;
      if (reps <= 0 || weight <= 0) {
        continue;
      }

      const date = toDateKey(log.session.sessionDate);
      const key = `${date}-${reps}`;
      const existing = progressionMap.get(key);
      if (!existing) {
        progressionMap.set(key, {
          date,
          reps,
          maxWeight: weight,
          volume: weight * reps,
        });
        continue;
      }

      existing.maxWeight = Math.max(existing.maxWeight, weight);
      existing.volume += weight * reps;
    }

    const progression = Array.from(progressionMap.values())
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.reps - b.reps;
        }
        return a.date.localeCompare(b.date);
      })
      .map((entry) => ({
        date: entry.date,
        reps: entry.reps,
        maxWeight: roundToOne(entry.maxWeight),
        volume: roundToOne(entry.volume),
      }));

    const progressionByReps = new Map<number, typeof progression>();
    for (const item of progression) {
      const bucket = progressionByReps.get(item.reps) || [];
      bucket.push(item);
      progressionByReps.set(item.reps, bucket);
    }

    let referenceReps: number | null = null;
    let referencePoints: typeof progression = [];

    for (const [reps, points] of progressionByReps.entries()) {
      if (referencePoints.length === 0) {
        referenceReps = reps;
        referencePoints = points;
        continue;
      }

      const hasMorePoints = points.length > referencePoints.length;
      const hasSamePoints = points.length === referencePoints.length;
      const latestCurrentDate = points[points.length - 1]?.date || '';
      const latestReferenceDate = referencePoints[referencePoints.length - 1]?.date || '';

      if (hasMorePoints || (hasSamePoints && latestCurrentDate > latestReferenceDate)) {
        referenceReps = reps;
        referencePoints = points;
      }
    }

    let initialWeight: number | null = null;
    let latestWeight: number | null = null;
    let maxWeight: number | null = null;

    if (referencePoints.length > 0) {
      initialWeight = referencePoints[0].maxWeight;
      latestWeight = referencePoints[referencePoints.length - 1].maxWeight;
      maxWeight = Math.max(...referencePoints.map((point) => point.maxWeight));
    }

    const progressPercent =
      initialWeight && initialWeight > 0 && latestWeight !== null && referencePoints.length > 1
        ? roundToOne(((latestWeight - initialWeight) / initialWeight) * 100)
        : null;

    let expectedSessions = 0;
    let completedScheduledSessions = 0;
    let pendingScheduledSessions = 0;
    let missedScheduledSessions = 0;
    let completionRate = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let consistencyInRange = 0;
    let attendanceTimeline: {
      weekStart: string;
      expected: number;
      completed: number;
      pending: number;
      missed: number;
      completionRate: number;
    }[] = [];

    const activePlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plan: {
          select: {
            daysPerWeek: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const routineDaysPerWeek = selectedRoutineDaysCount;
    const planDaysPerWeek = activePlan?.plan.daysPerWeek || 0;

    const expectedDaysPerWeek = routineDaysPerWeek > 0
      ? routineDaysPerWeek
      : planDaysPerWeek;
    const activeWeekDays = TRAINING_DAYS_BY_FREQUENCY[expectedDaysPerWeek] || null;

    if (activeWeekDays) {
      const rangeStart = analysisStartDate;
      const rangeEnd = analysisEndDate;
      const scheduledDates = buildScheduledDates(rangeStart, rangeEnd, activeWeekDays);
      const scheduledDateSet = new Set(scheduledDates);

      const routineSessions = await prisma.workoutSession.findMany({
        where: {
          userId,
          ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
          sessionDate: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          sessionDate: true,
          status: true,
        },
      });

      const sessionsByDate = new Map<string, 'completed' | 'pending' | 'skipped'>();
      for (const session of routineSessions) {
        const dateKey = toDateKey(session.sessionDate);
        const previousStatus = sessionsByDate.get(dateKey);

        if (!previousStatus) {
          sessionsByDate.set(dateKey, session.status as 'completed' | 'pending' | 'skipped');
          continue;
        }

        if (previousStatus !== 'completed' && session.status === 'completed') {
          sessionsByDate.set(dateKey, 'completed');
        }
      }

      expectedSessions = scheduledDates.length;
      const todayDateKey = toDateKey(startOfDay(new Date()));
      const weeklyMap = new Map<string, {
        weekStart: string;
        expected: number;
        completed: number;
        pending: number;
        missed: number;
      }>();

      for (const dateKey of scheduledDates) {
        const status = sessionsByDate.get(dateKey);
        const weekStart = getWeekStartKey(dateKey);
        const weekBucket = weeklyMap.get(weekStart) || {
          weekStart,
          expected: 0,
          completed: 0,
          pending: 0,
          missed: 0,
        };

        weekBucket.expected += 1;

        if (status === 'completed') {
          completedScheduledSessions += 1;
          weekBucket.completed += 1;
        } else if (status === 'pending') {
          pendingScheduledSessions += 1;
          weekBucket.pending += 1;
        } else if (!status && dateKey >= todayDateKey) {
          pendingScheduledSessions += 1;
          weekBucket.pending += 1;
        } else {
          missedScheduledSessions += 1;
          weekBucket.missed += 1;
        }

        weeklyMap.set(weekStart, weekBucket);
      }

      attendanceTimeline = Array.from(weeklyMap.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .map((bucket) => ({
          ...bucket,
          completionRate: bucket.expected > 0
            ? roundToOne((bucket.completed / bucket.expected) * 100)
            : 0,
        }));

      completionRate = expectedSessions > 0
        ? roundToOne((completedScheduledSessions / expectedSessions) * 100)
        : 0;

      const completedScheduledDateSet = new Set(
        Array.from(sessionsByDate.entries())
          .filter(([dateKey, status]) => status === 'completed' && scheduledDateSet.has(dateKey))
          .map(([dateKey]) => dateKey)
      );

      const streaks = calculateStreaks(scheduledDates, completedScheduledDateSet);
      bestStreak = streaks.bestStreak;

      const scheduleStatus = scheduledDates.map((dateKey) => {
        const status = sessionsByDate.get(dateKey);
        if (status === 'completed') {
          return 'completed';
        }
        if (status === 'pending') {
          return 'pending';
        }
        if (!status && dateKey >= todayDateKey) {
          return 'pending';
        }
        return 'missed';
      });

      const lastCompletedIndex = scheduleStatus.lastIndexOf('completed');

      if (lastCompletedIndex === -1) {
        currentStreak = 0;
      } else {
        let streak = 0;
        for (let index = lastCompletedIndex; index >= 0; index -= 1) {
          if (scheduleStatus[index] === 'completed') {
            streak += 1;
          } else {
            break;
          }
        }
        currentStreak = streak;
      }

      const completedInRange = scheduledDates.filter((dateKey) => completedScheduledDateSet.has(dateKey)).length;
      consistencyInRange = scheduledDates.length > 0
        ? roundToOne((completedInRange / scheduledDates.length) * 100)
        : 0;
    }

    const completedInRange = await prisma.workoutSession.count({
      where: {
        userId,
        status: 'completed',
        ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
        sessionDate: {
          gte: analysisStartDate,
          lte: analysisEndDate,
        },
      },
    });

    const logsInRange = await prisma.exerciseLog.findMany({
      where: {
        session: {
          userId,
          status: 'completed',
          ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
          sessionDate: {
            gte: analysisStartDate,
            lte: analysisEndDate,
          },
        },
        ...(muscleGroupFilter ? { exercise: { muscleGroup: muscleGroupFilter } } : {}),
      },
      select: {
        exerciseId: true,
        weight: true,
        reps: true,
        exercise: {
          select: {
            muscleGroup: true,
          },
        },
      },
    });

    let volumeInRange = 0;
    const exercisesInRange = new Set<number>();
    const muscleVolumeMap = new Map<string, number>();

    const exerciseFrequencyMap = new Map<number, {
      exerciseId: number;
      name: string;
      muscleGroup: string | null;
      sessionIds: Set<number>;
    }>();

    for (const log of completedLogs) {
      if (!log.exercise) {
        continue;
      }

      const existing = exerciseFrequencyMap.get(log.exerciseId);
      if (!existing) {
        exerciseFrequencyMap.set(log.exerciseId, {
          exerciseId: log.exerciseId,
          name: log.exercise.name,
          muscleGroup: log.exercise.muscleGroup,
          sessionIds: new Set([log.session.id]),
        });
        continue;
      }

      existing.sessionIds.add(log.session.id);
    }

    const exerciseFrequency = Array.from(exerciseFrequencyMap.values())
      .map((item) => ({
        exerciseId: item.exerciseId,
        name: item.name,
        muscleGroup: item.muscleGroup,
        sessionsCount: item.sessionIds.size,
      }))
      .sort((a, b) => {
        if (b.sessionsCount === a.sessionsCount) {
          return a.name.localeCompare(b.name);
        }
        return b.sessionsCount - a.sessionsCount;
      })
      .slice(0, 8);

    const previousFrequencyMap = new Map<number, {
      exerciseId: number;
      name: string;
      muscleGroup: string | null;
      sessionIds: Set<number>;
    }>();

    for (const log of previousLogs) {
      if (!log.exercise) {
        continue;
      }

      const existing = previousFrequencyMap.get(log.exerciseId);
      if (!existing) {
        previousFrequencyMap.set(log.exerciseId, {
          exerciseId: log.exerciseId,
          name: log.exercise.name,
          muscleGroup: log.exercise.muscleGroup,
          sessionIds: new Set([log.session.id]),
        });
        continue;
      }

      existing.sessionIds.add(log.session.id);
    }

    const abandonedExercises = Array.from(previousFrequencyMap.values())
      .map((exercise) => {
        const previousSessions = exercise.sessionIds.size;
        const currentSessions = exerciseFrequencyMap.get(exercise.exerciseId)?.sessionIds.size || 0;

        return {
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          previousSessions,
          currentSessions,
          dropPercent: previousSessions > 0
            ? roundToOne(((previousSessions - currentSessions) / previousSessions) * 100)
            : 0,
        };
      })
      .filter((exercise) => exercise.previousSessions > 0 && exercise.currentSessions === 0)
      .sort((a, b) => b.previousSessions - a.previousSessions)
      .slice(0, 6);

    for (const log of logsInRange) {
      const weight = log.weight || 0;
      const reps = log.reps || 0;
      if (weight > 0 && reps > 0) {
        const entryVolume = weight * reps;
        volumeInRange += entryVolume;

        const muscleGroup = log.exercise?.muscleGroup?.trim() || 'General';
        const previousVolume = muscleVolumeMap.get(muscleGroup) || 0;
        muscleVolumeMap.set(muscleGroup, previousVolume + entryVolume);
      }
      exercisesInRange.add(log.exerciseId);
    }

    const muscleVolumeBreakdown = Array.from(muscleVolumeMap.entries())
      .map(([muscleGroup, volume]) => ({
        muscleGroup,
        volume: roundToOne(volume),
      }))
      .sort((a, b) => b.volume - a.volume);

    const completedSessionsInRange = await prisma.workoutSession.count({
      where: {
        userId,
        status: 'completed',
        ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
        sessionDate: {
          gte: analysisStartDate,
          lte: analysisEndDate,
        },
      },
    });

    const averageVolumePerSessionInRange = completedSessionsInRange > 0
      ? roundToOne(volumeInRange / completedSessionsInRange)
      : 0;

    const lastCompletedSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        status: 'completed',
        ...(selectedRoutineIds ? { routineId: { in: selectedRoutineIds } } : {}),
      },
      orderBy: {
        sessionDate: 'desc',
      },
      select: {
        sessionDate: true,
      },
    });

    const availableMuscleGroups = Array.from(new Set(
      exercises
        .map((exercise) => exercise.muscleGroup)
        .filter((muscleGroup): muscleGroup is string => !!muscleGroup)
    )).sort((a, b) => a.localeCompare(b));

    return res.json({
      success: true,
      data: {
        filters: {
          period,
          routineFilter,
          muscleGroup: muscleGroupFilter,
          availableRoutines: routineOptions,
          availableMuscleGroups,
        },
        attendance: {
          expectedSessions,
          completedSessions: completedScheduledSessions,
          pendingSessions: pendingScheduledSessions,
          missedSessions: missedScheduledSessions,
          completionRate,
          weeklyTimeline: attendanceTimeline,
        },
        period: {
          startDate: analysisStartDate.toISOString(),
          endDate: analysisEndDate.toISOString(),
        },
        indicators: {
          currentStreak,
          bestStreak,
          consistencyInRange,
          completedInRange,
          volumeInRange: roundToOne(volumeInRange),
          averageVolumePerSessionInRange,
          uniqueExercisesInRange: exercisesInRange.size,
          lastCompletedAt: lastCompletedSession ? lastCompletedSession.sessionDate.toISOString() : null,
          exerciseFrequency,
          abandonedExercises,
          muscleVolumeBreakdown,
        },
        exercises,
        selectedExerciseId,
        progression,
        exerciseSnapshot: {
          referenceReps,
          initialWeight,
          latestWeight,
          maxWeight,
          progressPercent,
        },
      },
    });
  } catch (error) {
    console.error('Error en getProgressStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadisticas del usuario',
    });
  }
};

export const getWeightStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const weightLog = getWeightLogDelegate();

    if (!weightLog) {
      return res.status(503).json({
        success: false,
        message: 'Seguimiento de peso no disponible. Ejecuta migraciones de base y Prisma generate.',
      });
    }

    const period = typeof req.query.period === 'string' ? req.query.period : 'month';

    const now = new Date();
    const currentWeekStart = startOfDay(new Date(now));
    const currentDay = currentWeekStart.getDay();
    const weekOffset = currentDay === 0 ? 6 : currentDay - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - weekOffset);

    const defaultStartDateByPeriod: Record<string, Date> = {
      week: currentWeekStart,
      month: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      '3months': startOfDay(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      year: startOfDay(new Date(now.getFullYear(), 0, 1)),
      all: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      custom: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    };

    const defaultStartDate = defaultStartDateByPeriod[period] || defaultStartDateByPeriod.month;
    const defaultEndDate = endOfDay(now);

    const startDateParam = typeof req.query.startDate === 'string' ? req.query.startDate : null;
    const endDateParam = typeof req.query.endDate === 'string' ? req.query.endDate : null;

    const parsedStartDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const parsedEndDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Rango de fechas inválido',
      });
    }

    let analysisStartDate = startOfDay(parsedStartDate);
    const analysisEndDateRaw = endOfDay(parsedEndDate);
    const analysisEndDate = analysisEndDateRaw > defaultEndDate ? defaultEndDate : analysisEndDateRaw;

    if (period === 'all') {
      const firstWeightLog = await weightLog.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true },
      });

      if (firstWeightLog?.date) {
        analysisStartDate = startOfDay(firstWeightLog.date);
      }
    }

    if (analysisStartDate > analysisEndDate) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
      });
    }

    const weightLogs = await weightLog.findMany({
      where: {
        userId,
        date: {
          gte: analysisStartDate,
          lte: analysisEndDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const history = [...weightLogs]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 30)
      .map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        weight: roundToOne(log.weight),
        note: log.note,
      }));

    const timeline = weightLogs.map((log) => ({
      id: log.id,
      date: log.date.toISOString(),
      weight: roundToOne(log.weight),
      note: log.note,
    }));

    const trendWindow: number[] = [];
    const trend = timeline.map((point) => {
      trendWindow.push(point.weight);
      if (trendWindow.length > 7) {
        trendWindow.shift();
      }

      const average = trendWindow.reduce((total, value) => total + value, 0) / trendWindow.length;

      return {
        date: point.date,
        weight: point.weight,
        trendWeight: roundToOne(average),
      };
    });

    const weeklyMap = new Map<string, {
      weekStart: string;
      total: number;
      count: number;
    }>();

    for (const point of timeline) {
      const dateKey = toDateKey(new Date(point.date));
      const weekStart = getWeekStartKey(dateKey);
      const bucket = weeklyMap.get(weekStart) || {
        weekStart,
        total: 0,
        count: 0,
      };

      bucket.total += point.weight;
      bucket.count += 1;
      weeklyMap.set(weekStart, bucket);
    }

    const weeklyAverages = Array.from(weeklyMap.values())
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .map((bucket) => ({
        weekStart: bucket.weekStart,
        averageWeight: bucket.count > 0 ? roundToOne(bucket.total / bucket.count) : 0,
      }));

    const firstPoint = timeline[0] || null;
    const lastPoint = timeline[timeline.length - 1] || null;
    const changeKg = firstPoint && lastPoint
      ? roundToOne(lastPoint.weight - firstPoint.weight)
      : 0;
    const changePercent = firstPoint && firstPoint.weight > 0 && lastPoint
      ? roundToOne((changeKg / firstPoint.weight) * 100)
      : 0;

    const trackedDays = firstPoint && lastPoint
      ? Math.max(1, Math.floor((new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const weeklyRate = trackedDays > 0
      ? roundToOne((changeKg / trackedDays) * 7)
      : 0;

    return res.json({
      success: true,
      data: {
        period: {
          period,
          startDate: analysisStartDate.toISOString(),
          endDate: analysisEndDate.toISOString(),
        },
        summary: {
          currentWeight: lastPoint ? lastPoint.weight : null,
          initialWeight: firstPoint ? firstPoint.weight : null,
          changeKg,
          changePercent,
          weeklyRate,
          entriesCount: timeline.length,
        },
        trend,
        weeklyAverages,
        history,
      },
    });
  } catch (error) {
    console.error('Error en getWeightStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener seguimiento de peso',
    });
  }
};

export const createWeightLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const weightLog = getWeightLogDelegate();

    if (!weightLog) {
      return res.status(503).json({
        success: false,
        message: 'Seguimiento de peso no disponible. Ejecuta migraciones de base y Prisma generate.',
      });
    }

    const { date, weight, note } = req.body as {
      date?: string;
      weight?: number;
      note?: string;
    };

    if (!date || typeof date !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida',
      });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es inválida',
      });
    }

    if (typeof weight !== 'number' || Number.isNaN(weight) || weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El peso debe ser un número mayor a 0',
      });
    }

    const created = await weightLog.create({
      data: {
        userId,
        date: startOfDay(parsedDate),
        weight,
        note: note?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: created.id,
        date: created.date.toISOString(),
        weight: roundToOne(created.weight),
        note: created.note,
      },
    });
  } catch (error) {
    console.error('Error en createWeightLog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar peso',
    });
  }
};

export const deleteWeightLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const weightLog = getWeightLogDelegate();

    if (!weightLog) {
      return res.status(503).json({
        success: false,
        message: 'Seguimiento de peso no disponible. Ejecuta migraciones de base y Prisma generate.',
      });
    }

    const logId = Number(req.params.logId);

    if (Number.isNaN(logId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de registro inválido',
      });
    }

    const existing = await weightLog.findFirst({
      where: {
        id: logId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Registro de peso no encontrado',
      });
    }

    await weightLog.delete({
      where: {
        id: logId,
      },
    });

    return res.json({
      success: true,
      data: { id: logId },
    });
  } catch (error) {
    console.error('Error en deleteWeightLog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar registro de peso',
    });
  }
};
