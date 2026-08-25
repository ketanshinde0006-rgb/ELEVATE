import * as authService from '../services/auth.service.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';
import prisma from '../config/database.js';

function extractReqMeta(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

  let browser = 'Browser';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  let os = 'OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  let device = 'Desktop';
  if (/mobile|iphone|ipod|android.*mobile/i.test(userAgent)) device = 'Mobile';
  else if (/ipad|tablet/i.test(userAgent)) device = 'Tablet';

  return { userAgent, ipAddress, browser, os, device };
}

export async function register(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.registerUser(req.body, meta);
    return createdResponse(res, result, 'Account created successfully');
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.loginUser(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.googleLoginOrRegister(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Google authentication successful');
  } catch (error) {
    next(error);
  }
}

export async function appleAuth(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.appleLoginOrRegister(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Apple authentication successful');
  } catch (error) {
    next(error);
  }
}

export async function microsoftAuth(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.microsoftLoginOrRegister(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Microsoft authentication successful');
  } catch (error) {
    next(error);
  }
}

export async function phoneSendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    const result = await authService.sendMobileOtp(phone);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

export async function phoneVerifyOtp(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.verifyMobileOtpAndAuthenticate(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Mobile number verified successfully');
  } catch (error) {
    next(error);
  }
}

export async function emailOtpSend(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.sendEmailOtp(email);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

export async function emailOtpVerify(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.verifyEmailOtpAndAuthenticate(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Email code verified successfully');
  } catch (error) {
    next(error);
  }
}

export async function magicLinkSend(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.sendMagicLink(email);
    return successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

export async function magicLinkVerify(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.verifyMagicLink(req.body, meta);
    if (result.mfaRequired) {
      return successResponse(res, result, 'MFA verification required');
    }
    return successResponse(res, result, 'Magic Link authenticated successfully');
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token, email } = req.body;
    const result = await authService.verifyEmailToken(token, email);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.sendPasswordReset(email);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPasswordWithToken(req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changeUserPassword(req.user.id, req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function setPassword(req, res, next) {
  try {
    const result = await authService.setUserPassword(req.user.id, req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function mfaSetup(req, res, next) {
  try {
    const result = await authService.setupTwoFactor(req.user.id);
    return successResponse(res, result, '2FA setup generated');
  } catch (error) {
    next(error);
  }
}

export async function mfaEnable(req, res, next) {
  try {
    const result = await authService.enableTwoFactor(req.user.id, req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function mfaVerify(req, res, next) {
  try {
    const meta = extractReqMeta(req);
    const result = await authService.verifyTwoFactorLogin(req.body, meta);
    return successResponse(res, result, 'MFA login verified');
  } catch (error) {
    next(error);
  }
}

export async function mfaDisable(req, res, next) {
  try {
    const result = await authService.disableTwoFactor(req.user.id, req.body);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function getProviders(req, res, next) {
  try {
    const result = await authService.getConnectedProviders(req.user.id);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function unlinkProvider(req, res, next) {
  try {
    const { provider } = req.params;
    const result = await authService.unlinkProvider(req.user.id, provider);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(req, res, next) {
  try {
    const currentToken = req.headers['x-refresh-token'] || req.body?.refreshToken;
    const result = await authService.getActiveSessions(req.user.id, currentToken);
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const result = await authService.revokeSession(req.user.id, sessionId);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function revokeOtherSessions(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.revokeOtherSessions(req.user.id, refreshToken);
    return successResponse(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        provider: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        avatar: true,
        bio: true,
        password: true,
        preferredStyles: true,
        preferredColors: true,
        primaryOccasion: true,
        seasonFocus: true,
        profileVisibility: true,
        wardrobeVisibility: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password: rawPassword, ...safeUserData } = user;
    return successResponse(res, {
      ...safeUserData,
      hasPassword: !!rawPassword,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'avatar', 'bio',
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

    // If updating email, check uniqueness and format
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(updateData.email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format' });
      }
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another account' });
      }
    }

    // If updating phone, check uniqueness
    if (updateData.phone) {
      updateData.phone = updateData.phone.trim();
      const existingPhone = await prisma.user.findUnique({
        where: { phone: updateData.phone },
      });
      if (existingPhone && existingPhone.id !== req.user.id) {
        return res.status(400).json({ success: false, message: 'Phone number is already in use by another account' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        provider: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        avatar: true,
        bio: true,
        password: true,
        preferredStyles: true,
        preferredColors: true,
        primaryOccasion: true,
        seasonFocus: true,
        profileVisibility: true,
        wardrobeVisibility: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If email was updated, update any LOCAL AuthIdentity too
    if (updateData.email) {
      await prisma.authIdentity.updateMany({
        where: { userId: req.user.id, provider: 'LOCAL' },
        data: { email: updateData.email, providerAccountId: updateData.email },
      });
    }

    const { password: rawPassword, ...safeUserData } = user;
    return successResponse(res, {
      ...safeUserData,
      hasPassword: !!rawPassword,
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const meta = extractReqMeta(req);
    const tokens = await authService.refreshAccessToken(refreshToken, meta);
    return successResponse(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}
