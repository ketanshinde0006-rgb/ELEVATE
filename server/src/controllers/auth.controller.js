import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendPhoneOtp,
  verifyOtpAndRegister,
  googleLoginOrRegister,
} from '../services/auth.service.js';
import { successResponse, createdResponse, errorResponse } from '../utils/apiResponse.js';
import prisma from '../config/database.js';

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await registerUser(req.body);
    return createdResponse(res, { user, accessToken, refreshToken }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/otp/send
 */
export async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    const result = sendPhoneOtp(phone);
    return successResponse(res, result, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/otp/verify
 */
export async function verifyOtp(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await verifyOtpAndRegister(req.body);
    return createdResponse(res, { user, accessToken, refreshToken }, 'Mobile verified & account created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 */
export async function googleAuth(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await googleLoginOrRegister(req.body);
    return successResponse(res, { user, accessToken, refreshToken }, 'Google authentication successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    return successResponse(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);
    return successResponse(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await logoutUser(refreshToken);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, avatar: true, bio: true,
        preferredStyles: true, preferredColors: true,
        primaryOccasion: true, seasonFocus: true,
        profileVisibility: true, wardrobeVisibility: true,
        emailNotifications: true, createdAt: true,
      },
    });
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/auth/me
 */
export async function updateMe(req, res, next) {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'avatar', 'bio',
      'preferredStyles', 'preferredColors',
      'primaryOccasion', 'seasonFocus',
      'profileVisibility', 'wardrobeVisibility',
      'emailNotifications',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, avatar: true, bio: true,
        preferredStyles: true, preferredColors: true,
        primaryOccasion: true, seasonFocus: true,
        profileVisibility: true, wardrobeVisibility: true,
        emailNotifications: true,
      },
    });

    return successResponse(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/auth/password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { comparePassword, hashPassword } = await import('../services/auth.service.js');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    return successResponse(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
}
