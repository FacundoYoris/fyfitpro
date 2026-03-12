import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error en getPlans:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes',
    });
  }
};

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id: Number(id) },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error en getPlanById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plan',
    });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, price, durationDays, daysPerWeek, benefits } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price,
        durationDays,
        daysPerWeek,
        benefits,
      },
    });

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error en createPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear plan',
    });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationDays, daysPerWeek, benefits, isActive } = req.body;

    const plan = await prisma.plan.findUnique({ where: { id: Number(id) } });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    const updatedPlan = await prisma.plan.update({
      where: { id: Number(id) },
      data: {
        name: name || plan.name,
        description: description !== undefined ? description : plan.description,
        price: price || plan.price,
        durationDays: durationDays || plan.durationDays,
        daysPerWeek: daysPerWeek !== undefined ? daysPerWeek : plan.daysPerWeek,
        benefits: benefits !== undefined ? benefits : plan.benefits,
        isActive: isActive !== undefined ? isActive : plan.isActive,
      },
    });

    res.json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error en updatePlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar plan',
    });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({ where: { id: Number(id) } });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    await prisma.plan.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Plan eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en deletePlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar plan',
    });
  }
};

export const assignPlan = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;
    const adminId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado',
      });
    }

    await prisma.userPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const userPlan = await prisma.userPlan.create({
      data: {
        userId,
        planId,
        startDate,
        endDate,
        assignedBy: adminId,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: userPlan,
    });
  } catch (error) {
    console.error('Error en assignPlan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar plan',
    });
  }
};

export const getUserPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userPlans = await prisma.userPlan.findMany({
      where: { userId: Number(userId) },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });

    res.json({
      success: true,
      data: userPlans,
    });
  } catch (error) {
    console.error('Error en getUserPlans:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de planes',
    });
  }
};
