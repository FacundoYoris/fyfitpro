import { Request, Response } from 'express';
import prisma from '../config/database';

export const getStats = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const queryMonth = req.query.month ? Number(req.query.month) : undefined;
    const queryYear = req.query.year ? Number(req.query.year) : undefined;
    const currentMonth = queryMonth || currentDate.getMonth() + 1;
    const currentYear = queryYear || currentDate.getFullYear();

    const totalUsers = await prisma.user.count({ where: { role: 'user' } });
    const activeUsers = await prisma.user.count({ 
      where: { role: 'user', isActive: true } 
    });
    const inactiveUsers = totalUsers - activeUsers;

    const paymentsThisMonth = await prisma.payment.findMany({
      where: { month: currentMonth, year: currentYear },
    });

    const revenueThisMonth = paymentsThisMonth.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const [totalPlans, totalRoutines] = await Promise.all([
      prisma.plan.count({ where: { isActive: true } }),
      prisma.routine.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        revenueThisMonth,
        totalPlans,
        totalRoutines,
        paymentsThisMonth: paymentsThisMonth.length,
      },
    });
  } catch (error) {
    console.error('Error en getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
    });
  }
};

export const getUsersOverview = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, month, year } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const currentDate = new Date();
    const currentMonth = month ? Number(month) : currentDate.getMonth() + 1;
    const currentYear = year ? Number(year) : currentDate.getFullYear();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'user' },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dni: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { role: 'user' } }),
    ]);

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const userPlan = await prisma.userPlan.findFirst({
          where: { userId: user.id, isActive: true },
          include: { plan: true },
        });

        const userRoutine = await prisma.userRoutine.findFirst({
          where: { userId: user.id, isActive: true },
          include: {
            routine: { select: { id: true, name: true } },
          },
        });

        const payment = await prisma.payment.findFirst({
          where: {
            userId: user.id,
            month: currentMonth,
            year: currentYear,
          },
        });

        const activities = await prisma.userActivity.findMany({
          where: { userId: user.id },
          orderBy: { date: 'asc' },
        });

        const checkWasActiveInMonth = (month: number, year: number) => {
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);

          if (user.createdAt > monthEnd) return false;

          let wasActive = user.isActive;

          for (const activity of activities) {
            if (activity.date > monthEnd) break;
            if (activity.date <= monthEnd) {
              wasActive = activity.type === 'activation';
            }
          }

          return wasActive;
        };

        const wasActiveInMonth = checkWasActiveInMonth(currentMonth, currentYear);
        const shouldShowPayment = wasActiveInMonth;

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          dni: user.dni,
          isActive: user.isActive,
          createdAt: user.createdAt,
          plan: userPlan ? {
            id: userPlan.plan.id,
            name: userPlan.plan.name,
            price: userPlan.plan.price,
            endDate: userPlan.endDate,
          } : null,
          routine: userRoutine ? {
            id: userRoutine.routine.id,
            name: userRoutine.routine.name,
            assignedAt: userRoutine.assignedAt,
          } : null,
          paymentStatus: {
            isPaid: shouldShowPayment ? !!payment : true,
            paymentId: payment?.id ?? null,
            month: currentMonth,
            year: currentYear,
            lastPaymentDate: payment?.paymentDate?.toISOString() || null,
          },
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStatus,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error en getUsersOverview:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener visión general de usuarios',
    });
  }
};

export const getRevenue = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.paymentDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      const currentYear = new Date().getFullYear();
      whereClause.year = currentYear;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { paymentDate: 'asc' },
    });

    const revenueByMonth: Record<string, number> = {};
    payments.forEach((payment) => {
      const key = `${payment.year}-${String(payment.month).padStart(2, '0')}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(payment.amount);
    });

    const totalRevenue = Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0);

    res.json({
      success: true,
      data: {
        revenueByMonth,
        totalRevenue,
        paymentsCount: payments.length,
      },
    });
  } catch (error) {
    console.error('Error en getRevenue:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingresos',
    });
  }
};
