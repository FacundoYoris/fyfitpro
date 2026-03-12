import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { getUserProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/profile', authMiddleware, getUserProfile);

export default router;
