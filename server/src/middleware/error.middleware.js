import logger from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Global error handling middleware
 */
export function errorHandler(err, req, res, _next) {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });

  // Prisma known errors
  if (err.code === 'P2002') {
    return errorResponse(res, 'A record with this value already exists', 409);
  }
  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }
  if (err.code === 'P2003') {
    return errorResponse(res, 'Related record not found', 400);
  }

  // Joi validation error
  if (err.isJoi) {
    const messages = err.details.map(d => d.message);
    return errorResponse(res, messages.join('. '), 422, messages);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File too large. Maximum size is 5MB', 413);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return errorResponse(res, 'Unexpected file field', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Custom app errors
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
  return errorResponse(res, `Route ${req.method} ${req.url} not found`, 404);
}

/**
 * Custom AppError class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
