import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
  getActiveRoutine, 
  getCalendar, 
  saveWorkoutLogs, 
  getExerciseHistory,
  getLastWeights
} from '../controllers/memberController';

const router = Router();

router.get('/routine', authMiddleware, getActiveRoutine);
router.get('/calendar', authMiddleware, getCalendar);
router.post('/workout/logs', authMiddleware, saveWorkoutLogs);
router.get('/exercise/history', authMiddleware, getExerciseHistory);
router.get('/exercise/last-weights', authMiddleware, getLastWeights);

export default router;