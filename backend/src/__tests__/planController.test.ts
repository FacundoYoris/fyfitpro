import request from 'supertest';
import { createTestApp, createTestUser, createTestAdmin, generateTestToken, createTestPlan } from './testUtils';
import prisma from '../config/database';
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan, assignPlan, getUserPlans } from '../controllers/planController';
import { authMiddleware } from '../middleware/authMiddleware';

describe('Plan Controller', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    
    app.get('/api/plans', getPlans);
    app.get('/api/plans/:id', getPlanById);
    app.post('/api/plans', authMiddleware, createPlan);
    app.put('/api/plans/:id', authMiddleware, updatePlan);
    app.delete('/api/plans/:id', authMiddleware, deletePlan);
    app.post('/api/plans/assign', authMiddleware, assignPlan);
    app.get('/api/plans/user/:userId', authMiddleware, getUserPlans);
  });

  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    next();
  };

  describe('GET /api/plans', () => {
    it('debería obtener todos los planes activos', async () => {
      await createTestPlan({ name: 'Plan Basic' });
      await createTestPlan({ name: 'Plan Premium' });
      await prisma.plan.create({ data: { name: 'Plan Inactive', price: 50, durationDays: 30, isActive: false } });

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('debería ordenar planes por precio ascendente', async () => {
      await createTestPlan({ name: 'Plan Premium', price: 200 });
      await createTestPlan({ name: 'Plan Basic', price: 50 });

      const response = await request(app).get('/api/plans');

      expect(response.status).toBe(200);
      expect(response.body.data[0].price).toBe(50);
      expect(response.body.data[1].price).toBe(200);
    });
  });

  describe('GET /api/plans/:id', () => {
    it('debería obtener plan por ID', async () => {
      const plan = await createTestPlan({ name: 'Test Plan' });

      const response = await request(app).get(`/api/plans/${plan.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Plan');
    });

    it('debería devolver 404 para plan inexistente', async () => {
      const response = await request(app).get('/api/plans/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('no encontrado');
    });
  });

  describe('POST /api/plans', () => {
    it('debería crear plan exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/plans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Nuevo Plan',
          description: 'Plan de prueba',
          price: 150,
          durationDays: 30,
          daysPerWeek: 4,
          benefits: 'Todos los beneficios',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Nuevo Plan');
    });
  });

  describe('PUT /api/plans/:id', () => {
    it('debería actualizar plan exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const plan = await createTestPlan({ name: 'Old Name', price: 100 });

      const response = await request(app)
        .put(`/api/plans/${plan.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', price: 150 });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.price).toBe(150);
    });

    it('debería devolver 404 para plan inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .put('/api/plans/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });

    it('debería poder desactivar un plan', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const plan = await createTestPlan({ name: 'Test Plan' });

      const response = await request(app)
        .put(`/api/plans/${plan.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/plans/:id', () => {
    it('debería eliminar plan (soft delete) exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const plan = await createTestPlan({ name: 'Test Plan' });

      const response = await request(app)
        .delete(`/api/plans/${plan.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedPlan = await prisma.plan.findUnique({ where: { id: plan.id } });
      expect(deletedPlan?.isActive).toBe(false);
    });

    it('debería devolver 404 para plan inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .delete('/api/plans/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/plans/assign', () => {
    it('debería asignar plan a usuario exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });
      const plan = await createTestPlan({ name: 'Test Plan', durationDays: 30 });

      const response = await request(app)
        .post('/api/plans/assign')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user.id, planId: plan.id });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const userPlan = await prisma.userPlan.findFirst({
        where: { userId: user.id, isActive: true },
      });
      expect(userPlan).not.toBeNull();
      expect(userPlan?.planId).toBe(plan.id);
    });

    it('debería desactivar plan anterior al asignar nuevo plan', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });
      const plan1 = await createTestPlan({ name: 'Plan 1', durationDays: 30 });
      const plan2 = await createTestPlan({ name: 'Plan 2', durationDays: 60 });

      await prisma.userPlan.create({
        data: { userId: user.id, planId: plan1.id, startDate: new Date(), isActive: true },
      });

      await request(app)
        .post('/api/plans/assign')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user.id, planId: plan2.id });

      const oldPlan = await prisma.userPlan.findFirst({
        where: { userId: user.id, planId: plan1.id },
      });
      expect(oldPlan?.isActive).toBe(false);
    });

    it('debería devolver 404 si el usuario no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const plan = await createTestPlan({ name: 'Test Plan' });

      const response = await request(app)
        .post('/api/plans/assign')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: 9999, planId: plan.id });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Usuario no encontrado');
    });

    it('debería devolver 404 si el plan no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });

      const response = await request(app)
        .post('/api/plans/assign')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user.id, planId: 9999 });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Plan no encontrado');
    });

    it('debería calcular fecha de fin correctamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });
      const plan = await createTestPlan({ name: 'Test Plan', durationDays: 30 });

      const response = await request(app)
        .post('/api/plans/assign')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user.id, planId: plan.id });

      const userPlan = await prisma.userPlan.findFirst({ where: { userId: user.id } });
      const expectedEndDate = new Date();
      expectedEndDate.setDate(expectedEndDate.getDate() + 30);

      expect(new Date(userPlan!.endDate!).toDateString()).toBe(expectedEndDate.toDateString());
    });
  });

  describe('GET /api/plans/user/:userId', () => {
    it('debería obtener historial de planes del usuario', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'user@test.com' });
      const plan = await createTestPlan({ name: 'Test Plan' });

      await prisma.userPlan.create({
        data: { userId: user.id, planId: plan.id, startDate: new Date(), isActive: true },
      });

      const response = await request(app)
        .get(`/api/plans/user/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });
});
