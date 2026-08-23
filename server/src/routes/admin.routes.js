import { Router } from 'express';
import {
  getSystemStats,
  getAnalytics,
  getUsers,
  getUserDetail,
  updateUserRole,
  updateUserStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStyles,
  createStyle,
  updateStyle,
  deleteStyle,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  getReports,
  createReport,
  resolveReport,
  dismissReport,
  getAuditLogs,
  getSystemHealth,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// ── Overview & Stats ──
router.get('/stats', getSystemStats);
router.get('/analytics', getAnalytics);

// ── Users ──
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

// ── Fashion Categories ──
router.get('/fashion/categories', getCategories);
router.post('/fashion/categories', createCategory);
router.patch('/fashion/categories/:id', updateCategory);
router.delete('/fashion/categories/:id', deleteCategory);

// ── Fashion Styles ──
router.get('/fashion/styles', getStyles);
router.post('/fashion/styles', createStyle);
router.patch('/fashion/styles/:id', updateStyle);
router.delete('/fashion/styles/:id', deleteStyle);

// ── Brands ──
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.patch('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// ── Media Library ──
router.get('/media', getMediaFiles);
router.post('/media/upload', upload.single('file'), uploadMediaFile);
router.delete('/media/:filename', deleteMediaFile);

// ── Moderation & Reports ──
router.get('/reports', getReports);
router.post('/reports', createReport);
router.patch('/reports/:id/resolve', resolveReport);
router.patch('/reports/:id/dismiss', dismissReport);

// ── Audit Logs ──
router.get('/audit-log', getAuditLogs);

// ── System Health ──
router.get('/system/health', getSystemHealth);

export default router;
