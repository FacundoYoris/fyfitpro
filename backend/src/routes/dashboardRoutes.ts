import { Router } from 'express';
import { getStats, getUsersOverview, getRevenue } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/stats', authMiddleware, roleMiddleware('admin'), getStats);
router.get('/users-overview', authMiddleware, roleMiddleware('admin'), getUsersOverview);
router.get('/revenue', authMiddleware, roleMiddleware('admin'), getRevenue);

export default router;
