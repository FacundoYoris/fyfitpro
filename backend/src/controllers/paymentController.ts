import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { userId, month, year } = req.query;
    
    const whereClause: any = {};
    if (userId) whereClause.userId = Number(userId);
    if (month) whereClause.month = Number(month);
    if (year) whereClause.year = Number(year);

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, dni: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error en getPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
    });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, dni: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error en getPaymentById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
    });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { userId, amount, paymentDate, paymentMethod, receipt, month, year } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        month: Number(month),
        year: Number(year),
      },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un pago registrado para este usuario en el mes especificado',
      });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        paymentDate,
        paymentMethod,
        receipt,
        month: Number(month),
        year: Number(year),
      },
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error en createPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
    });
  }
};

export const getUserPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const payment = await prisma.payment.findFirst({
      where: {
        userId: Number(userId),
        month: currentMonth,
        year: currentYear,
      },
    });

    const userPlan = await prisma.userPlan.findFirst({
      where: { userId: Number(userId), isActive: true },
      include: { plan: true },
    });

    res.json({
      success: true,
      data: {
        isPaid: !!payment,
        payment: payment || null,
        plan: userPlan ? userPlan.plan : null,
        currentMonth,
        currentYear,
      },
    });
  } catch (error) {
    console.error('Error en getUserPaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado de pago',
    });
  }
};

export const markMonthAsPaid = async (req: Request, res: Response) => {
  try {
    const { userId, month, year, amount, paymentMethod = 'cash' } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
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

    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        month: Number(month),
        year: Number(year),
      },
    });

    const resolvedAmount = typeof amount === 'number' && amount > 0
      ? amount
      : existingPayment?.amount ?? activePlan?.plan.price ?? 0;

    if (resolvedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto inválido para registrar el pago',
      });
    }

    if (existingPayment) {
      const updatedPayment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: resolvedAmount,
          paymentDate: new Date(),
          paymentMethod,
        },
      });

      return res.json({
        success: true,
        data: updatedPayment,
        message: 'Pago actualizado',
      });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: resolvedAmount,
        paymentDate: new Date(),
        paymentMethod,
        month: Number(month),
        year: Number(year),
      },
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error en markMonthAsPaid:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar pago',
    });
  }
};

export const markMonthAsUnpaid = async (req: Request, res: Response) => {
  try {
    const { userId, month, year } = req.body;

    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        month: Number(month),
        year: Number(year),
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No hay pago registrado para ese período',
      });
    }

    await prisma.payment.delete({ where: { id: payment.id } });

    res.json({
      success: true,
      message: 'Pago revertido correctamente',
    });
  } catch (error) {
    console.error('Error en markMonthAsUnpaid:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revertir pago',
    });
  }
};

export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { userId: Number(userId) },
      orderBy: { paymentDate: 'desc' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error en getUserPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos del usuario',
    });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado',
      });
    }

    await prisma.payment.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Pago eliminado correctamente',
    });
  } catch (error) {
    console.error('Error en deletePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar pago',
    });
  }
};
