import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
  getActiveRoutine, 
  getCalendar, 
  saveWorkoutLogs, 
  getWorkoutSessionById,
  getWorkoutSessionByDate,
  getExerciseHistory,
  getLastWeights,
  getProgressStats,
  getWeightStats,
  createWeightLog,
  deleteWeightLog
} from '../controllers/memberController';

const router = Router();

router.get('/routine', authMiddleware, getActiveRoutine);
router.get('/calendar', authMiddleware, getCalendar);
router.post('/workout/logs', authMiddleware, saveWorkoutLogs);
router.get('/workout/session/:sessionId', authMiddleware, getWorkoutSessionById);
router.get('/workout/session', authMiddleware, getWorkoutSessionByDate);
router.get('/exercise/history', authMiddleware, getExerciseHistory);
router.get('/exercise/last-weights', authMiddleware, getLastWeights);
router.get('/stats', authMiddleware, getProgressStats);
router.get('/weight/stats', authMiddleware, getWeightStats);
router.post('/weight/log', authMiddleware, createWeightLog);
router.delete('/weight/log/:logId', authMiddleware, deleteWeightLog);

export default router;
