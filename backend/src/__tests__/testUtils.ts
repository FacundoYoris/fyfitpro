import express, { Express } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../config/jwt';
import { login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

export const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(cors());

  app.post('/api/auth/login', login);
  app.get('/api/auth/me', authMiddleware, getMe);

  return app;
};

export const createTestUser = async (overrides: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dni?: string;
  role?: string;
  isActive?: boolean;
} = {}) => {
  const hashedPassword = await bcrypt.hash(overrides.password || 'test123', 10);
  return prisma.user.create({
    data: {
      email: overrides.email || 'test@test.com',
      password: hashedPassword,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      phone: overrides.phone || null,
      dni: overrides.dni || null,
      role: overrides.role || 'user',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
};

export const createTestAdmin = async () => {
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@gimnasio.com' } });
  if (existingAdmin) {
    return existingAdmin;
  }
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  return prisma.user.create({
    data: {
      email: 'admin@gimnasio.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    },
  });
};

export const createTestPlan = async (overrides: {
  name?: string;
  price?: number;
  durationDays?: number;
} = {}) => {
  return prisma.plan.create({
    data: {
      name: overrides.name || 'Plan Test',
      description: 'Test plan description',
      price: overrides.price || 100,
      durationDays: overrides.durationDays || 30,
      daysPerWeek: 3,
      benefits: 'Test benefits',
      isActive: true,
    },
  });
};

export const generateTestToken = (user: { id: number; email: string; role: string }) => {
  return generateToken({ id: user.id, email: user.email, role: user.role });
};
