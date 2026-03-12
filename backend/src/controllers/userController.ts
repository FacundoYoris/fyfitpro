import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { role: 'user' };
    
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { dni: { contains: search } },
      ];
    }

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          dni: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        userPlans: {
          include: { plan: true },
          orderBy: { startDate: 'desc' },
        },
        userRoutines: {
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
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, dni, role = 'user' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    if (dni) {
      const existingDni = await prisma.user.findUnique({ where: { dni } });
      if (existingDni) {
        return res.status(400).json({
          success: false,
          message: 'El DNI ya está registrado',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        dni,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, dni, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone !== undefined ? phone : user.phone,
        dni: dni !== undefined ? dni : user.dni,
        role: role || user.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
    });
  }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: !user.isActive },
      select: { isActive: true },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error en toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dni: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const activePlan = await prisma.userPlan.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
    });

    const userRoutines = await prisma.userRoutine.findMany({
      where: { userId, isActive: true },
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

    const latestPayment = await prisma.payment.findFirst({
      where: { userId },
      orderBy: { paymentDate: 'desc' },
    });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentPayment = await prisma.payment.findFirst({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
    });

    res.json({
      success: true,
      data: {
        user,
        plan: activePlan ? {
          id: activePlan.plan.id,
          name: activePlan.plan.name,
          price: activePlan.plan.price,
          endDate: activePlan.endDate,
          daysPerWeek: activePlan.plan.daysPerWeek,
        } : null,
        routines: userRoutines.map(ur => ({
          id: ur.routine.id,
          name: ur.routine.name,
          description: ur.routine.description,
          duration: ur.routine.duration,
          days: ur.routine.routineDays?.length || 0,
          assignedAt: ur.assignedAt,
        })),
        payment: latestPayment ? {
          amount: latestPayment.amount,
          month: latestPayment.month,
          year: latestPayment.year,
          paymentDate: latestPayment.paymentDate,
        } : null,
        isPaid: !!currentPayment,
      },
    });
  } catch (error) {
    console.error('Error en getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
    });
  }
};
