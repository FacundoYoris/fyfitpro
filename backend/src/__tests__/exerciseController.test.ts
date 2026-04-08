import request from 'supertest';
import { createTestApp, createTestUser, createTestAdmin, generateTestToken } from './testUtils';
import prisma from '../config/database';
import { getExercises, getExerciseById, createExercise, updateExercise, deleteExercise } from '../controllers/exerciseController';
import { authMiddleware } from '../middleware/authMiddleware';

describe('Exercise Controller', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    
    app.get('/api/exercises', getExercises);
    app.get('/api/exercises/:id', getExerciseById);
    app.post('/api/exercises', authMiddleware, createExercise);
    app.put('/api/exercises/:id', authMiddleware, updateExercise);
    app.delete('/api/exercises/:id', authMiddleware, deleteExercise);
  });

  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    next();
  };

  describe('GET /api/exercises', () => {
    it('debería obtener todos los ejercicios activos', async () => {
      await prisma.exercise.create({ data: { name: 'Exercise 1', isActive: true } });
      await prisma.exercise.create({ data: { name: 'Exercise 2', isActive: true } });
      await prisma.exercise.create({ data: { name: 'Inactive Exercise', isActive: false } });

      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('debería ordenar ejercicios alfabéticamente', async () => {
      await prisma.exercise.create({ data: { name: 'Zebra Exercise', isActive: true } });
      await prisma.exercise.create({ data: { name: 'Alpha Exercise', isActive: true } });

      const response = await request(app).get('/api/exercises');

      expect(response.status).toBe(200);
      expect(response.body.data[0].name).toBe('Alpha Exercise');
      expect(response.body.data[1].name).toBe('Zebra Exercise');
    });

    it('debería filtrar por grupo muscular', async () => {
      await prisma.muscleGroup.create({ data: { name: 'Pecho' } });
      await prisma.muscleGroup.create({ data: { name: 'Espalda' } });
      
      await prisma.exercise.create({ data: { name: 'Press Banca', muscleGroup: 'Pecho', isActive: true } });
      await prisma.exercise.create({ data: { name: 'Remo', muscleGroup: 'Espalda', isActive: true } });

      const response = await request(app).get('/api/exercises?muscleGroup=Pecho');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].muscleGroup).toBe('Pecho');
    });
  });

  describe('GET /api/exercises/:id', () => {
    it('debería obtener ejercicio por ID', async () => {
      const exercise = await prisma.exercise.create({
        data: { name: 'Test Exercise', muscleGroup: 'Pecho', isActive: true },
      });

      const response = await request(app).get(`/api/exercises/${exercise.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Exercise');
    });

    it('debería devolver 404 para ejercicio inexistente', async () => {
      const response = await request(app).get('/api/exercises/9999');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('no encontrado');
    });
  });

  describe('POST /api/exercises', () => {
    it('debería crear ejercicio exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      await prisma.muscleGroup.create({ data: { name: 'Pecho' } });

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Press Banca',
          muscleGroup: 'Pecho',
          description: 'Ejercicio de pecho',
          defaultSets: 4,
          defaultReps: 12,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Press Banca');
    });

    it('debería usar valores por defecto para sets y reps', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Simple Exercise',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.defaultSets).toBe(3);
      expect(response.body.data.defaultReps).toBe(10);
    });

    it('debería devolver error 400 si el grupo muscular no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Exercise',
          muscleGroup: 'GrupoInexistente',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('grupo muscular no existe');
    });

    it('debería permitir crear ejercicio sin grupo muscular', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Exercise sin grupo',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/exercises/:id', () => {
    it('debería actualizar ejercicio exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const exercise = await prisma.exercise.create({
        data: { name: 'Old Name', isActive: true },
      });

      const response = await request(app)
        .put(`/api/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', defaultSets: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.defaultSets).toBe(5);
    });

    it('debería devolver 404 para ejercicio inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .put('/api/exercises/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });

    it('debería devolver error 400 si el grupo muscular no existe', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const exercise = await prisma.exercise.create({
        data: { name: 'Test Exercise', isActive: true },
      });

      const response = await request(app)
        .put(`/api/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ muscleGroup: 'GrupoInexistente' });

      expect(response.status).toBe(400);
    });

    it('debería poder desactivar un ejercicio', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const exercise = await prisma.exercise.create({
        data: { name: 'Test Exercise', isActive: true },
      });

      const response = await request(app)
        .put(`/api/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/exercises/:id', () => {
    it('debería eliminar ejercicio (soft delete) exitosamente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);
      const exercise = await prisma.exercise.create({
        data: { name: 'Test Exercise', isActive: true },
      });

      const response = await request(app)
        .delete(`/api/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedExercise = await prisma.exercise.findUnique({
        where: { id: exercise.id },
      });
      expect(deletedExercise?.isActive).toBe(false);
    });

    it('debería devolver 404 para ejercicio inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateTestToken(admin);

      const response = await request(app)
        .delete('/api/exercises/9999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
