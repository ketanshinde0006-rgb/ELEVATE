import { Router } from 'express';
import { getCategories, getStyles, getStyle, saveStyle, getSavedStyles } from '../controllers/fashion.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/categories', getCategories);
router.get('/styles', getStyles);
router.get('/styles/:id', getStyle);

// Authenticated
router.post('/styles/:id/save', authenticate, saveStyle);
router.get('/saved', authenticate, getSavedStyles);

export default router;
