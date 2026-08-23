import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendations.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', authenticate, getRecommendations);

export default router;
