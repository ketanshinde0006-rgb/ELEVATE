import { Router } from 'express';
import { getTasks, createTask, updateTask, toggleTask, deleteTask } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { taskSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getTasks);
router.post('/', validate(taskSchema), createTask);
router.patch('/:id', updateTask);
router.patch('/:id/toggle', toggleTask);
router.delete('/:id', deleteTask);

export default router;
