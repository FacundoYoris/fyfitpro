import { Router } from 'express';
import { 
  getRoutines, 
  getRoutineById, 
  createRoutine, 
  updateRoutine, 
  deleteRoutine,
  assignRoutine,
  getUserRoutines,
  getUserActiveRoutine
} from '../controllers/routineController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, getRoutines);
router.get('/:id', authMiddleware, getRoutineById);
router.post('/', authMiddleware, roleMiddleware('admin'), createRoutine);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateRoutine);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteRoutine);
router.post('/assign', authMiddleware, roleMiddleware('admin'), assignRoutine);
router.get('/user/:userId', authMiddleware, roleMiddleware('admin'), getUserRoutines);
router.get('/user/me/routine', authMiddleware, getUserActiveRoutine);

export default router;
