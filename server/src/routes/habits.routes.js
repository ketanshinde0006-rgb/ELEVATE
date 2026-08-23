import { Router } from 'express';
import { getHabits, createHabit, updateHabit, completeHabit, deleteHabit } from '../controllers/habits.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { habitSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getHabits);
router.post('/', validate(habitSchema), createHabit);
router.patch('/:id', updateHabit);
router.post('/:id/complete', completeHabit);
router.delete('/:id', deleteHabit);

export default router;
