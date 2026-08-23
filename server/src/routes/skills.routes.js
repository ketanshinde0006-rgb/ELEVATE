import { Router } from 'express';
import { getSkills, createSkill, updateSkill, toggleMilestone, deleteSkill } from '../controllers/skills.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { skillSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getSkills);
router.post('/', validate(skillSchema), createSkill);
router.patch('/:id', updateSkill);
router.patch('/:id/milestones/:milestoneId', toggleMilestone);
router.delete('/:id', deleteSkill);

export default router;
