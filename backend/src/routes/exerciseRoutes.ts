import { Router } from 'express';
import { 
  getExercises, 
  getExerciseById, 
  createExercise, 
  updateExercise, 
  deleteExercise 
} from '../controllers/exerciseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, getExercises);
router.get('/:id', authMiddleware, getExerciseById);
router.post('/', authMiddleware, roleMiddleware('admin'), createExercise);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateExercise);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteExercise);

export default router;
