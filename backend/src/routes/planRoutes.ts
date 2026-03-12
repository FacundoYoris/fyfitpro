import { Router } from 'express';
import { 
  getPlans, 
  getPlanById, 
  createPlan, 
  updatePlan, 
  deletePlan,
  assignPlan,
  getUserPlans
} from '../controllers/planController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, getPlans);
router.get('/:id', authMiddleware, getPlanById);
router.post('/', authMiddleware, roleMiddleware('admin'), createPlan);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updatePlan);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deletePlan);
router.post('/assign', authMiddleware, roleMiddleware('admin'), assignPlan);
router.get('/user/:userId', authMiddleware, roleMiddleware('admin'), getUserPlans);

export default router;
