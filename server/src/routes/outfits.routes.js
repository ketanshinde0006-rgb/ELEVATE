import { Router } from 'express';
import { getOutfits, getOutfit, createOutfit, updateOutfit, toggleFavorite, deleteOutfit } from '../controllers/outfits.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/auth.validator.js';
import { outfitSchema } from '../validators/domain.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', getOutfits);
router.get('/:id', getOutfit);
router.post('/', validate(outfitSchema), createOutfit);
router.patch('/:id', updateOutfit);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteOutfit);

export default router;
