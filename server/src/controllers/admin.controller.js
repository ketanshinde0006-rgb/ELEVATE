import * as adminService from '../services/admin.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// ── Overview & Stats ──
export async function getSystemStats(req, res, next) {
  try {
    const stats = await adminService.getSystemStats();
    return successResponse(res, stats);
  } catch (error) { next(error); }
}

export async function getAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getAnalytics();
    return successResponse(res, analytics);
  } catch (error) { next(error); }
}

// ── Users ──
export async function getUsers(req, res, next) {
  try {
    const data = await adminService.getUsers(req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
}

export async function getUserDetail(req, res, next) {
  try {
    const user = await adminService.getUserDetail(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, user);
  } catch (error) { next(error); }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const user = await adminService.updateUserRole(req.user.id, req.params.id, role);
    return successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    if (error.message.includes('Invalid role') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    const user = await adminService.updateUserStatus(req.user.id, req.params.id, status);
    return successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    if (error.message.includes('Invalid status') || error.message.includes('not found')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
}

// ── Fashion Categories ──
export async function getCategories(req, res, next) {
  try {
    const categories = await adminService.getCategories();
    return successResponse(res, categories);
  } catch (error) { next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const category = await adminService.createCategory(req.user.id, req.body);
    return successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await adminService.updateCategory(req.user.id, req.params.id, req.body);
    return successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    await adminService.deleteCategory(req.user.id, req.params.id);
    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    if (error.message.includes('Cannot delete')) return errorResponse(res, error.message, 400);
    next(error);
  }
}

// ── Fashion Styles ──
export async function getStyles(req, res, next) {
  try {
    const data = await adminService.getStyles(req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
}

export async function createStyle(req, res, next) {
  try {
    const style = await adminService.createStyle(req.user.id, req.body);
    return successResponse(res, style, 'Style created successfully', 201);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('not exist')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
}

export async function updateStyle(req, res, next) {
  try {
    const style = await adminService.updateStyle(req.user.id, req.params.id, req.body);
    return successResponse(res, style, 'Style updated successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    if (error.message.includes('not exist')) return errorResponse(res, error.message, 400);
    next(error);
  }
}

export async function deleteStyle(req, res, next) {
  try {
    await adminService.deleteStyle(req.user.id, req.params.id);
    return successResponse(res, null, 'Style deleted successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

// ── Brands ──
export async function getBrands(req, res, next) {
  try {
    const data = await adminService.getBrands(req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
}

export async function createBrand(req, res, next) {
  try {
    const brand = await adminService.createBrand(req.user.id, req.body);
    return successResponse(res, brand, 'Brand created successfully', 201);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
}

export async function updateBrand(req, res, next) {
  try {
    const brand = await adminService.updateBrand(req.user.id, req.params.id, req.body);
    return successResponse(res, brand, 'Brand updated successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

export async function deleteBrand(req, res, next) {
  try {
    await adminService.deleteBrand(req.user.id, req.params.id);
    return successResponse(res, null, 'Brand deleted successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

// ── Media Library ──
export async function getMediaFiles(req, res, next) {
  try {
    const media = await adminService.getMediaFiles();
    return successResponse(res, media);
  } catch (error) { next(error); }
}

export async function uploadMediaFile(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    await adminService.logAuditEvent({
      userId: req.user.id,
      action: 'UPLOAD_MEDIA',
      entity: 'MediaFile',
      entityId: req.file.filename,
      details: `Uploaded file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
    });

    return successResponse(
      res,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
      },
      'File uploaded successfully',
      201
    );
  } catch (error) { next(error); }
}

export async function deleteMediaFile(req, res, next) {
  try {
    await adminService.deleteMediaFile(req.user.id, req.params.filename);
    return successResponse(res, null, 'Media file deleted successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

// ── Moderation & Reports ──
export async function getReports(req, res, next) {
  try {
    const data = await adminService.getReports(req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
}

export async function createReport(req, res, next) {
  try {
    const report = await adminService.createReport(req.user.id, req.body);
    return successResponse(res, report, 'Report submitted successfully', 201);
  } catch (error) {
    if (error.message.includes('required')) return errorResponse(res, error.message, 400);
    next(error);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const { notes } = req.body;
    const report = await adminService.resolveReport(req.user.id, req.params.id, notes);
    return successResponse(res, report, 'Report resolved successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

export async function dismissReport(req, res, next) {
  try {
    const { notes } = req.body;
    const report = await adminService.dismissReport(req.user.id, req.params.id, notes);
    return successResponse(res, report, 'Report dismissed successfully');
  } catch (error) {
    if (error.message.includes('not found')) return errorResponse(res, error.message, 404);
    next(error);
  }
}

// ── Audit Logs ──
export async function getAuditLogs(req, res, next) {
  try {
    const data = await adminService.getAuditLogs(req.query);
    return successResponse(res, data);
  } catch (error) { next(error); }
}

// ── System Health ──
export async function getSystemHealth(req, res, next) {
  try {
    const health = await adminService.getSystemHealth();
    return successResponse(res, health);
  } catch (error) { next(error); }
}
