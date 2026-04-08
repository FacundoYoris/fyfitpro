import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createTestApp, createTestUser, createTestAdmin, generateTestToken } from './testUtils';
import prisma from '../config/database';
import { login, getMe } from '../controllers/authController';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import express, { Response, NextFunction } from 'express';

describe('Auth Controller', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión exitosamente con credenciales válidas', async () => {
      const user = await createTestUser({ email: 'test@example.com', password: 'password123' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('debería devolver error 400 si no se proporciona email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email y contraseña son requeridos');
    });

    it('debería devolver error 400 si no se proporciona password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email y contraseña son requeridos');
    });

    it('debería devolver error 400 si no se proporciona ningún dato', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debería devolver error 401 si el email no existe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('debería devolver error 401 si la contraseña es incorrecta', async () => {
      await createTestUser({ email: 'test@example.com', password: 'password123' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciales inválidas');
    });

    it('debería devolver error 401 si el usuario está inactivo', async () => {
      await createTestUser({ email: 'test@example.com', password: 'password123', isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactivo');
    });

    it('debería manejar errores del servidor correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/api/auth/me', authMiddleware, getMe);

    it('debería obtener los datos del usuario autenticado', async () => {
      const user = await createTestUser({ email: 'test@example.com' });
      const token = generateTestToken(user);

      const response = await request(testApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('debería devolver error 401 sin token de autorización', async () => {
      const response = await request(testApp)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debería devolver error 401 con token inválido', async () => {
      const response = await request(testApp)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Token inválido');
    });

    it('debería devolver error 404 si el usuario no existe', async () => {
      const token = generateTestToken({ id: 9999, email: 'nonexistent@test.com', role: 'user' });

      const response = await request(testApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
