import { Router } from 'express';
import { getGoals, getGoal, createGoal, updateGoal, deleteGoal } from '../controllers/goals.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { goalSchema, updateGoalSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getGoals);
router.get('/:id', getGoal);
router.post('/', validate(goalSchema), createGoal);
router.patch('/:id', validate(updateGoalSchema), updateGoal);
router.delete('/:id', deleteGoal);

export default router;
