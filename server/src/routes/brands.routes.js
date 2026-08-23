import { Router } from 'express';
import { getBrands, getBrand, saveBrand, getSavedBrands } from '../controllers/brands.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/', getBrands);
router.get('/saved', authenticate, getSavedBrands);
router.get('/:id', getBrand);

// Authenticated
router.post('/:id/save', authenticate, saveBrand);

export default router;
