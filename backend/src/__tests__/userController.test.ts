import request from 'supertest';
import { createTestApp, createTestUser, createTestAdmin, generateTestToken, createTestPlan } from './testUtils';
import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, getUserProfile } from '../controllers/userController';
import prisma from '../config/database';

describe('User Controller', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    
    app.get('/api/users', authMiddleware, getUsers);
    app.get('/api/users/:id', authMiddleware, getUserById);
    app.post('/api/users', authMiddleware, createUser);
    app.put('/api/users/:id', authMiddleware, updateUser);
    app.delete('/api/users/:id', authMiddleware, deleteUser);
    app.patch('/api/users/:id/toggle-status', authMiddleware, toggleUserStatus);
    app.get('/api/users/profile/me', authMiddleware, getUserProfile);
  });

  describe('GET /api/users', () => {
    it('debería obtener lista de usuarios con paginación', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      await createTestUser({ email: 'user1@test.com', firstName: 'Juan' });
      await createTestUser({ email: 'user2@test.com', firstName: 'Pedro' });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('debería filtrar usuarios por búsqueda', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      await createTestUser({ email: 'user1@test.com', firstName: 'Juan' });
      await createTestUser({ email: 'user2@test.com', firstName: 'Pedro' });

      const response = await request(app)
        .get('/api/users?search=Juan')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].firstName).toBe('Juan');
    });

    it('debería filtrar usuarios por status activo', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      await createTestUser({ email: 'user1@test.com', firstName: 'Juan', isActive: true });
      await createTestUser({ email: 'user2@test.com', firstName: 'Pedro', isActive: false });

      const response = await request(app)
        .get('/api/users?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].isActive).toBe(true);
    });

    it('debería filtrar usuarios por status inactivo', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      await createTestUser({ email: 'user1@test.com', firstName: 'Juan', isActive: true });
      await createTestUser({ email: 'user2@test.com', firstName: 'Pedro', isActive: false });

      const response = await request(app)
        .get('/api/users?status=inactive')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].isActive).toBe(false);
    });

    it('debería paginar correctamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      for (let i = 0; i < 15; i++) {
        await createTestUser({ email: `user${i}@test.com` });
      }

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(10);
      expect(response.body.data.total).toBe(15);
      expect(response.body.data.totalPages).toBe(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('debería obtener usuario por ID', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com', firstName: 'Test' });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Test');
    });

    it('debería devolver 404 para usuario inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .get('/api/users/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('no encontrado');
    });

    it('debería incluir planes, rutinas y pagos del usuario', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('userPlans');
      expect(response.body.data).toHaveProperty('userRoutines');
      expect(response.body.data).toHaveProperty('payments');
    });
  });

  describe('POST /api/users', () => {
    it('debería crear usuario exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
    });

    it('debería devolver error 400 si el email ya existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      await createTestUser({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'existing@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email ya está registrado');
    });

    it('debería devolver error 400 si el DNI ya existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      await createTestUser({ email: 'user1@test.com', dni: '12345678' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          dni: '12345678',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('DNI ya está registrado');
    });

    it('debería crear usuario con rol admin si se especifica', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'admin2@test.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('admin');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('debería actualizar usuario exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com', firstName: 'OldName' });

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'NewName' });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('NewName');
    });

    it('debería devolver 404 para usuario inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .put('/api/users/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'NewName' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('debería eliminar usuario (soft delete) exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com' });

      const response = await request(app)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deletedUser?.isActive).toBe(false);
    });

    it('debería devolver 404 para usuario inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .delete('/api/users/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/toggle-status', () => {
    it('debería cambiar usuario activo a inactivo', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com', isActive: true });

      const response = await request(app)
        .patch(`/api/users/${user.id}/toggle-status`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
    });

    it('debería cambiar usuario inactivo a activo', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const user = await createTestUser({ email: 'test@test.com', isActive: false });

      const response = await request(app)
        .patch(`/api/users/${user.id}/toggle-status`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(true);
    });
  });

  describe('GET /api/users/profile/me', () => {
    it('debería obtener perfil del usuario autenticado', async () => {
      const user = await createTestUser({ email: 'test@test.com' });
      const token = generateTestToken(user);
      const plan = await createTestPlan();

      await prisma.userPlan.create({
        data: {
          userId: user.id,
          planId: plan.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/api/users/profile/me', authMiddleware, getUserProfile);

      const response = await request(testApp)
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@test.com');
      expect(response.body.data.plan).not.toBeNull();
    });
  });
});
