import request from 'supertest';
import { createTestApp, createTestUser, createTestAdmin, generateTestToken, createTestPlan } from './testUtils';
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getPayments, createPayment, getUserPaymentStatus, markMonthAsPaid, markMonthAsUnpaid, getUserPayments, deletePayment } from '../controllers/paymentController';
import prisma from '../config/database';

describe('Payment Controller', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    
    app.get('/api/payments', authMiddleware, getPayments);
    app.get('/api/payments/user/:userId/status', authMiddleware, getUserPaymentStatus);
    app.post('/api/payments', authMiddleware, createPayment);
    app.post('/api/payments/mark-paid', authMiddleware, markMonthAsPaid);
    app.post('/api/payments/mark-unpaid', authMiddleware, markMonthAsUnpaid);
    app.get('/api/payments/user/:userId', authMiddleware, getUserPayments);
    app.delete('/api/payments/:id', authMiddleware, deletePayment);
  });

  describe('GET /api/payments', () => {
    it('debería obtener todos los pagos', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: 100,
          paymentDate: new Date(),
          month: 1,
          year: 2024,
        },
      });

      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debería filtrar pagos por userId', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await prisma.payment.create({
        data: { userId: user1.id, amount: 100, paymentDate: new Date(), month: 1, year: 2024 },
      });

      const response = await request(app)
        .get(`/api/payments?userId=${user1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('debería filtrar pagos por mes y año', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      await prisma.payment.create({
        data: { userId: user.id, amount: 100, paymentDate: new Date(), month: 1, year: 2024 },
      });
      await prisma.payment.create({
        data: { userId: user.id, amount: 100, paymentDate: new Date(), month: 2, year: 2024 },
      });

      const response = await request(app)
        .get('/api/payments?month=1&year=2024')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].month).toBe(1);
    });
  });

  describe('POST /api/payments', () => {
    it('debería crear pago exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          amount: 100,
          paymentDate: new Date().toISOString(),
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(100);
    });

    it('debería devolver error 404 si el usuario no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 9999,
          amount: 100,
          paymentDate: new Date().toISOString(),
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Usuario no encontrado');
    });

    it('debería devolver error 400 si ya existe pago para ese mes', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      await prisma.payment.create({
        data: { userId: user.id, amount: 100, paymentDate: new Date(), month: 1, year: 2024 },
      });

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          amount: 100,
          paymentDate: new Date().toISOString(),
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Ya existe un pago registrado');
    });
  });

  describe('GET /api/payments/user/:userId/status', () => {
    it('debería devolver isPaid true si el usuario pagó el mes actual', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: 100,
          paymentDate: new Date(),
          month: currentMonth,
          year: currentYear,
        },
      });

      const response = await request(app)
        .get(`/api/payments/user/${user.id}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isPaid).toBe(true);
    });

    it('debería devolver isPaid false si el usuario no pagó el mes actual', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const response = await request(app)
        .get(`/api/payments/user/${user.id}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isPaid).toBe(false);
    });
  });

  describe('POST /api/payments/mark-paid', () => {
    it('debería marcar mes como pagado', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const response = await request(app)
        .post('/api/payments/mark-paid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          month: 1,
          year: 2024,
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('debería actualizar pago existente si ya existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      await prisma.payment.create({
        data: { userId: user.id, amount: 50, paymentDate: new Date(), month: 1, year: 2024 },
      });

      const response = await request(app)
        .post('/api/payments/mark-paid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          month: 1,
          year: 2024,
          amount: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Pago actualizado');
    });

    it('debería usar precio del plan si no se especifica monto', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });
      const plan = await createTestPlan({ price: 150 });

      await prisma.userPlan.create({
        data: {
          userId: user.id,
          planId: plan.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      const response = await request(app)
        .post('/api/payments/mark-paid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.amount).toBe(150);
    });

    it('debería devolver error 404 si el usuario no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/payments/mark-paid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: 9999,
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payments/mark-unpaid', () => {
    it('debería marcar mes como no pagado (eliminar pago)', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      await prisma.payment.create({
        data: { userId: user.id, amount: 100, paymentDate: new Date(), month: 1, year: 2024 },
      });

      const response = await request(app)
        .post('/api/payments/mark-unpaid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const payment = await prisma.payment.findFirst({
        where: { userId: user.id, month: 1, year: 2024 },
      });
      expect(payment).toBeNull();
    });

    it('debería devolver error 404 si no hay pago para ese período', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const response = await request(app)
        .post('/api/payments/mark-unpaid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          month: 1,
          year: 2024,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('No hay pago registrado');
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('debería eliminar pago exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const payment = await prisma.payment.create({
        data: { userId: user.id, amount: 100, paymentDate: new Date(), month: 1, year: 2024 },
      });

      const response = await request(app)
        .delete(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      expect(deletedPayment).toBeNull();
    });

    it('debería devolver 404 para pago inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .delete('/api/payments/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
