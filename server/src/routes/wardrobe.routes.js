import { Router } from 'express';
import { getItems, getItem, createItem, updateItem, toggleFavorite, deleteItem, getStats } from '../controllers/wardrobe.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', getItems);
router.get('/stats', getStats);
router.get('/:id', getItem);
router.post('/', upload.single('image'), createItem);
router.patch('/:id', upload.single('image'), updateItem);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteItem);

export default router;
