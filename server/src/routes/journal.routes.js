import { Router } from 'express';
import { getEntries, createEntry, updateEntry, deleteEntry } from '../controllers/journal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { journalSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getEntries);
router.post('/', validate(journalSchema), createEntry);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
