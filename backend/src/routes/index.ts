import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import planRoutes from './planRoutes';
import paymentRoutes from './paymentRoutes';
import exerciseRoutes from './exerciseRoutes';
import routineRoutes from './routineRoutes';
import dashboardRoutes from './dashboardRoutes';
import muscleGroupRoutes from './muscleGroupRoutes';
import memberRoutes from './memberRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/plans', planRoutes);
router.use('/payments', paymentRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/routines', routineRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/muscle-groups', muscleGroupRoutes);
router.use('/members', memberRoutes);

export default router;
