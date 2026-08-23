import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/database.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Verify JWT access token and attach user to request
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Invalid token', 401);
  }
}

/**
 * Optional authentication — sets req.user if token is valid, but doesn't block
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true },
    });

    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}

/**
 * Role-based access control
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

/**
 * Verify the requester owns the resource (for user-scoped data)
 */
export function ownershipCheck(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body[paramName];
    if (resourceUserId && resourceUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }
    next();
  };
}
