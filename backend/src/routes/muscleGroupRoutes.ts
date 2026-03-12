import { Router } from 'express';
import { getMuscleGroups, createMuscleGroup, updateMuscleGroup, deleteMuscleGroup } from '../controllers/muscleGroupController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.get('/', authMiddleware, roleMiddleware('admin'), getMuscleGroups);
router.post('/', authMiddleware, roleMiddleware('admin'), createMuscleGroup);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateMuscleGroup);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteMuscleGroup);

export default router;
