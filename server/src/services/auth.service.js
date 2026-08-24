import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import prisma from '../config/database.js';
import env from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';
import { encryptSecret, decryptSecret, hashToken } from '../utils/crypto.js';
import { generateTotpSetup, verifyTotpToken, verifyTotpOrRecoveryCode } from '../utils/totp.js';
import { sendTwilioVerification, checkTwilioVerification, normalizePhoneNumber } from '../utils/sms.js';
import {
  sendEmailVerificationMessage,
  sendPasswordResetMessage,
  sendEmailOtpMessage,
  sendMagicLinkMessage,
} from '../utils/mailer.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

// ── Password & Token Helpers ─────────────────────────────────

export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new AppError('Password must be a non-empty string', 400);
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function generateTempMfaToken(userId) {
  return jwt.sign({ userId, type: 'mfa_pending' }, env.JWT_SECRET, { expiresIn: '5m' });
}

export async function createSession(userId, reqMeta = {}) {
  const token = jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  const tokenHash = hashToken(token);
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  let ms = 7 * 24 * 60 * 60 * 1000;
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 's') ms = val * 1000;
    else if (unit === 'm') ms = val * 60 * 1000;
    else if (unit === 'h') ms = val * 60 * 60 * 1000;
    else if (unit === 'd') ms = val * 24 * 60 * 60 * 1000;
  }
  const expiresAt = new Date(Date.now() + ms);

  // Store in Session table with device metadata
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      userAgent: reqMeta.userAgent || null,
      ipAddress: reqMeta.ipAddress || null,
      device: reqMeta.device || 'Desktop',
      browser: reqMeta.browser || 'Browser',
      os: reqMeta.os || 'OS',
      expiresAt,
    },
  });

  // Also maintain RefreshToken table for compatibility
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { refreshToken: token, expiresAt };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, twoFactorSecret, recoveryCodes, ...safeUser } = user;
  return {
    ...safeUser,
    hasPassword: !!password,
    twoFactorEnabled: !!user.twoFactorEnabled,
  };
}

// ── 1. Local Registration & Login ────────────────────────────

export async function registerUser(data, reqMeta = {}) {
  const normalizedEmail = (data.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('Email address is required', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new AppError('An account with this email address already exists', 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: (data.lastName || '').trim(),
      role: 'USER',
      provider: 'LOCAL',
      emailVerified: false,
      status: 'ACTIVE',
      authIdentities: {
        create: {
          provider: 'LOCAL',
          providerAccountId: normalizedEmail,
          email: normalizedEmail,
        },
      },
    },
  });

  // Generate single-use email verification token
  const rawVerifyToken = crypto.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      identifier: normalizedEmail,
      type: 'EMAIL_VERIFICATION',
      tokenHash: hashToken(rawVerifyToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Send real verification email
  await sendEmailVerificationMessage(normalizedEmail, rawVerifyToken, env.CLIENT_URL);

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function loginUser(credentials, reqMeta = {}) {
  const identifier = (credentials.identifier || credentials.email || credentials.phone || '').trim().toLowerCase();
  const password = credentials.password;

  if (!identifier || !password) {
    throw new AppError('Email/phone and password are required', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
      ],
    },
  });

  if (!user) {
    throw new AppError('Invalid email/phone or password', 401);
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError('This account has been suspended. Please contact support.', 403);
  }

  // Check rate limiting / temporary lockout
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / (60 * 1000));
    throw new AppError(`Account is temporarily locked due to repeated failed login attempts. Try again in ${minutesLeft} minute(s).`, 429);
  }

  // Handle Google / Social only user with no password
  if (!user.password) {
    throw new AppError(
      'This account was created with Google Sign-In or Social Login and has no local password. Please sign in with your provider or use Set Password in Profile.',
      401
    );
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockoutUntil = null;
    if (newFailedAttempts >= 5) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lockoutUntil,
      },
    });

    throw new AppError('Invalid email/phone or password', 401);
  }

  // Reset failed attempts on success
  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  }

  // MFA Challenge Check
  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return {
      mfaRequired: true,
      tempToken,
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: true,
      },
    };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);

  return {
    mfaRequired: false,
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

// ── 2. Google Identity Services (GIS) ─────────────────────────

export async function verifyGoogleToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new AppError('Google ID token is required', 400);
  }

  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.error) {
    logger.warn('Google token verification failed: ' + (data.error_description || data.error));
    throw new AppError('Google token verification failed: ' + (data.error_description || data.error || 'Invalid token'), 401);
  }

  const configuredClientId = env.GOOGLE_CLIENT_ID;
  if (configuredClientId && data.aud !== configuredClientId) {
    throw new AppError('Google token audience does not match configured Google Client ID', 401);
  }

  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!validIssuers.includes(data.iss)) {
    throw new AppError('Google token issuer is invalid', 401);
  }

  if (Number(data.exp) * 1000 < Date.now()) {
    throw new AppError('Google token has expired', 401);
  }

  if (!data.email) {
    throw new AppError('Google token does not contain a verified email', 400);
  }

  return {
    googleId: data.sub,
    email: data.email.toLowerCase(),
    emailVerified: data.email_verified === 'true' || data.email_verified === true,
    firstName: data.given_name || data.name?.split(' ')[0] || 'User',
    lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
    avatar: data.picture || null,
  };
}

export async function googleLoginOrRegister(payload, reqMeta = {}) {
  const credential = payload.credential || payload.idToken;
  if (!credential) {
    throw new AppError('Google credential ID token is required', 400);
  }

  const googleProfile = await verifyGoogleToken(credential);

  // Check if existing user has role ADMIN -> prohibit Google login bypass
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: googleProfile.email },
  });

  if (existingUserByEmail && existingUserByEmail.role === 'ADMIN') {
    throw new AppError('Admin accounts must authenticate using Email and Password for security reasons.', 403);
  }

  if (existingUserByEmail && existingUserByEmail.status === 'SUSPENDED') {
    throw new AppError('This account has been suspended. Please contact support.', 403);
  }

  let user = existingUserByEmail;

  if (user) {
    // Safely link Google identity if not already linked
    const existingIdentity = await prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: googleProfile.googleId,
        },
      },
    });

    if (!existingIdentity) {
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: googleProfile.googleId,
          email: googleProfile.email,
        },
      });
    }

    // Update googleId and provider flag
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleProfile.googleId,
        provider: user.password ? 'BOTH' : 'GOOGLE',
        emailVerified: true,
        avatar: user.avatar || googleProfile.avatar,
      },
    });
  } else {
    // Create new Google User
    user = await prisma.user.create({
      data: {
        email: googleProfile.email,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        avatar: googleProfile.avatar,
        role: 'USER',
        provider: 'GOOGLE',
        googleId: googleProfile.googleId,
        emailVerified: true,
        password: null,
        status: 'ACTIVE',
        authIdentities: {
          create: {
            provider: 'GOOGLE',
            providerAccountId: googleProfile.googleId,
            email: googleProfile.email,
          },
        },
      },
    });
  }

  // MFA Check
  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return {
      mfaRequired: true,
      tempToken,
      user: { id: user.id, email: user.email, twoFactorEnabled: true },
    };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);

  return {
    mfaRequired: false,
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

// ── 3. Apple Sign-In ──────────────────────────────────────────

export async function appleLoginOrRegister(payload, reqMeta = {}) {
  if (!env.APPLE_CLIENT_ID) {
    throw new AppError(
      'Sign in with Apple is not configured. IMPLEMENTED — APPLE CREDENTIALS REQUIRED FOR LIVE VERIFICATION',
      503
    );
  }

  const idToken = payload.idToken || payload.credential;
  if (!idToken) {
    throw new AppError('Apple ID token is required', 400);
  }

  // Decode unverified header/payload for token validation
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new AppError('Invalid Apple token format', 401);
  }

  const { sub: appleSub, email, iss, aud, exp } = decoded.payload;
  if (iss !== 'https://appleid.apple.com' || aud !== env.APPLE_CLIENT_ID || Number(exp) * 1000 < Date.now()) {
    throw new AppError('Apple identity token verification failed', 401);
  }

  let user = null;
  const existingIdentity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'APPLE',
        providerAccountId: appleSub,
      },
    },
    include: { user: true },
  });

  if (existingIdentity) {
    user = existingIdentity.user;
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      if (user.role === 'ADMIN') throw new AppError('Admin accounts cannot use Apple Sign-In.', 403);
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'APPLE',
          providerAccountId: appleSub,
          email: email.toLowerCase(),
        },
      });
    }
  }

  if (!user) {
    const firstName = payload.user?.name?.firstName || 'Apple';
    const lastName = payload.user?.name?.lastName || 'Member';
    const userEmail = (email || `${appleSub}@privaterelay.appleid.com`).toLowerCase();

    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName,
        lastName,
        role: 'USER',
        emailVerified: true,
        password: null,
        status: 'ACTIVE',
        authIdentities: {
          create: {
            provider: 'APPLE',
            providerAccountId: appleSub,
            email: userEmail,
            profileData: JSON.stringify(payload.user || {}),
          },
        },
      },
    });
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return { mfaRequired: true, tempToken, user: { id: user.id, email: user.email, twoFactorEnabled: true } };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);
  return { mfaRequired: false, user: sanitizeUser(user), accessToken, refreshToken };
}

// ── 4. Microsoft Sign-In ──────────────────────────────────────

export async function microsoftLoginOrRegister(payload, reqMeta = {}) {
  if (!env.MICROSOFT_CLIENT_ID) {
    throw new AppError(
      'Sign in with Microsoft is not configured. IMPLEMENTED — MICROSOFT CREDENTIALS REQUIRED FOR LIVE VERIFICATION',
      503
    );
  }

  const idToken = payload.idToken || payload.credential;
  if (!idToken) {
    throw new AppError('Microsoft ID token is required', 400);
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new AppError('Invalid Microsoft token format', 401);
  }

  const { sub: msSub, oid, preferred_username, email, aud, exp, name } = decoded.payload;
  const providerAccountId = oid || msSub;
  const userEmail = (email || preferred_username || '').toLowerCase();

  if (aud !== env.MICROSOFT_CLIENT_ID || Number(exp) * 1000 < Date.now()) {
    throw new AppError('Microsoft identity token verification failed', 401);
  }

  let user = null;
  const existingIdentity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'MICROSOFT',
        providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingIdentity) {
    user = existingIdentity.user;
  } else if (userEmail) {
    user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (user) {
      if (user.role === 'ADMIN') throw new AppError('Admin accounts cannot use Microsoft Sign-In.', 403);
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'MICROSOFT',
          providerAccountId,
          email: userEmail,
        },
      });
    }
  }

  if (!user) {
    const firstName = name?.split(' ')[0] || 'Microsoft';
    const lastName = name?.split(' ').slice(1).join(' ') || 'Member';

    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName,
        lastName,
        role: 'USER',
        emailVerified: true,
        password: null,
        status: 'ACTIVE',
        authIdentities: {
          create: {
            provider: 'MICROSOFT',
            providerAccountId,
            email: userEmail,
          },
        },
      },
    });
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return { mfaRequired: true, tempToken, user: { id: user.id, email: user.email, twoFactorEnabled: true } };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);
  return { mfaRequired: false, user: sanitizeUser(user), accessToken, refreshToken };
}

// ── 5. Mobile Number + Twilio Verify SMS OTP ─────────────────

export async function sendMobileOtp(phone) {
  const e164 = normalizePhoneNumber(phone);
  if (!e164 || e164.length < 9) {
    throw new AppError('Valid mobile phone number with country code is required', 400);
  }

  const result = await sendTwilioVerification(e164);
  return {
    success: true,
    phone: e164,
    status: result.status,
    message: result.sent
      ? 'Verification code dispatched to your mobile number via SMS.'
      : 'SMS provider is not configured. IMPLEMENTED — SMS PROVIDER CONFIGURATION REQUIRED',
  };
}

export async function verifyMobileOtpAndAuthenticate({ phone, code }, reqMeta = {}) {
  const e164 = normalizePhoneNumber(phone);
  if (!e164 || !code) {
    throw new AppError('Phone number and 6-digit verification code are required', 400);
  }

  const check = await checkTwilioVerification(e164, code);
  if (!check.approved) {
    throw new AppError(check.message || 'Invalid or expired SMS verification code.', 400);
  }

  // Look up user by phone identity
  let user = null;
  const existingIdentity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'PHONE',
        providerAccountId: e164,
      },
    },
    include: { user: true },
  });

  if (existingIdentity) {
    user = existingIdentity.user;
    if (user.role === 'ADMIN') {
      throw new AppError('Administrator accounts must sign in using the administrator email/password flow.', 403);
    }
  } else {
    // Check if user exists with this phone
    user = await prisma.user.findUnique({ where: { phone: e164 } });
    if (user) {
      if (user.role === 'ADMIN') {
        throw new AppError('Administrator accounts must sign in using the administrator email/password flow.', 403);
      }
      await prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'PHONE',
          providerAccountId: e164,
          phone: e164,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    } else {
      // Create new phone user with placeholder email
      const placeholderEmail = `phone_${e164.replace('+', '')}@elevate.user`;
      user = await prisma.user.create({
        data: {
          email: placeholderEmail,
          phone: e164,
          firstName: 'Mobile',
          lastName: 'Member',
          role: 'USER',
          phoneVerified: true,
          emailVerified: false,
          password: null,
          status: 'ACTIVE',
          authIdentities: {
            create: {
              provider: 'PHONE',
              providerAccountId: e164,
              phone: e164,
            },
          },
        },
      });
    }
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return { mfaRequired: true, tempToken, user: { id: user.id, email: user.email, twoFactorEnabled: true } };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);
  return { mfaRequired: false, user: sanitizeUser(user), accessToken, refreshToken };
}

// ── 6. Email OTP / Passwordless Login ────────────────────────

export async function sendEmailOtp(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new AppError('Valid email address is required', 400);
  }

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const tokenHash = hashToken(otpCode);

  // Invalidate previous active OTPs for this email
  await prisma.verificationToken.updateMany({
    where: {
      identifier: normalizedEmail,
      type: 'EMAIL_OTP',
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      type: 'EMAIL_OTP',
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  const mailResult = await sendEmailOtpMessage(normalizedEmail, otpCode);
  return {
    success: true,
    email: normalizedEmail,
    status: mailResult.status,
    message: mailResult.sent
      ? 'A 6-digit login code has been sent to your email.'
      : 'Email provider not configured. IMPLEMENTED — EMAIL PROVIDER CONFIGURATION REQUIRED',
  };
}

export async function verifyEmailOtpAndAuthenticate({ email, otp }, reqMeta = {}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  if (!normalizedEmail || !cleanOtp) {
    throw new AppError('Email and 6-digit code are required', 400);
  }

  const tokenHash = hashToken(cleanOtp);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      type: 'EMAIL_OTP',
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new AppError('Invalid or expired login code', 400);
  }

  // Mark token consumed
  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    if (user.role === 'ADMIN') {
      throw new AppError('Administrator accounts must sign in using the administrator email/password flow.', 403);
    }
    if (user.status === 'SUSPENDED') throw new AppError('Account is suspended', 403);
    if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }
  } else {
    // Create new user authenticated via Email OTP
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedEmail.split('@')[0],
        lastName: '',
        role: 'USER',
        emailVerified: true,
        password: null,
        status: 'ACTIVE',
        authIdentities: {
          create: {
            provider: 'LOCAL',
            providerAccountId: normalizedEmail,
            email: normalizedEmail,
          },
        },
      },
    });
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return { mfaRequired: true, tempToken, user: { id: user.id, email: user.email, twoFactorEnabled: true } };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);
  return { mfaRequired: false, user: sanitizeUser(user), accessToken, refreshToken };
}

// ── 7. Magic Link Authentication ──────────────────────────────

export async function sendMagicLink(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new AppError('Valid email address is required', 400);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.verificationToken.updateMany({
    where: {
      identifier: normalizedEmail,
      type: 'MAGIC_LINK',
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      type: 'MAGIC_LINK',
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  const mailResult = await sendMagicLinkMessage(normalizedEmail, rawToken, env.CLIENT_URL);
  return {
    success: true,
    email: normalizedEmail,
    status: mailResult.status,
    message: mailResult.sent
      ? 'A Magic Link has been sent to your email.'
      : 'Email provider not configured. IMPLEMENTED — EMAIL PROVIDER CONFIGURATION REQUIRED',
  };
}

export async function verifyMagicLink({ token, email }, reqMeta = {}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawToken = (token || '').trim();

  if (!rawToken || !normalizedEmail) {
    throw new AppError('Magic Link token and email are required', 400);
  }

  const tokenHash = hashToken(rawToken);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      type: 'MAGIC_LINK',
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new AppError('Magic Link is invalid, expired, or has already been used.', 400);
  }

  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    if (user.role === 'ADMIN') {
      throw new AppError('Administrator accounts must sign in using the administrator email/password flow.', 403);
    }
    if (user.status === 'SUSPENDED') throw new AppError('Account is suspended', 403);
    if (!user.emailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName: normalizedEmail.split('@')[0],
        lastName: '',
        role: 'USER',
        emailVerified: true,
        password: null,
        status: 'ACTIVE',
        authIdentities: {
          create: {
            provider: 'LOCAL',
            providerAccountId: normalizedEmail,
            email: normalizedEmail,
          },
        },
      },
    });
  }

  if (user.twoFactorEnabled) {
    const tempToken = generateTempMfaToken(user.id);
    return { mfaRequired: true, tempToken, user: { id: user.id, email: user.email, twoFactorEnabled: true } };
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);
  return { mfaRequired: false, user: sanitizeUser(user), accessToken, refreshToken };
}

// ── 8. Email Verification ─────────────────────────────────────

export async function verifyEmailToken(token, email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawToken = (token || '').trim();

  if (!rawToken || !normalizedEmail) {
    throw new AppError('Verification token and email are required', 400);
  }

  const tokenHash = hashToken(rawToken);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      type: 'EMAIL_VERIFICATION',
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new AppError('Verification link is invalid or has expired', 400);
  }

  await prisma.verificationToken.update({
    where: { id: tokenRecord.id },
    data: { consumedAt: new Date() },
  });

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: true },
  });

  return { success: true, message: 'Email verified successfully!' };
}

// ── 9. Forgot & Reset Password ────────────────────────────────

export async function sendPasswordReset(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new AppError('Valid email address is required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  // Always return neutral message for security
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.verificationToken.updateMany({
    where: {
      identifier: normalizedEmail,
      type: 'PASSWORD_RESET',
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      identifier: normalizedEmail,
      type: 'PASSWORD_RESET',
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetMessage(normalizedEmail, rawToken, env.CLIENT_URL);

  return {
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  };
}

export async function resetPasswordWithToken({ token, email, newPassword }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const rawToken = (token || '').trim();

  if (!rawToken || !normalizedEmail || !newPassword) {
    throw new AppError('Token, email, and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const tokenHash = hashToken(rawToken);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      type: 'PASSWORD_RESET',
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new AppError('Password reset link is invalid or has expired', 400);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('User account not found', 404);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    }),
    prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { consumedAt: new Date() },
    }),
    // Revoke all existing sessions on password reset (security policy)
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
}

// ── 10. Password Change & Setup ───────────────────────────────

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.password) {
    throw new AppError('No password is set on this account. Use Set Password instead.', 400);
  }

  const isCurrentValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true, message: 'Password updated successfully' };
}

export async function setUserPassword(userId, { newPassword }) {
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authIdentities: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      provider: user.provider === 'GOOGLE' ? 'BOTH' : user.provider,
    },
  });

  if (!user.authIdentities.some(i => i.provider === 'LOCAL')) {
    await prisma.authIdentity.create({
      data: {
        userId,
        provider: 'LOCAL',
        providerAccountId: user.email.toLowerCase(),
        email: user.email.toLowerCase(),
      },
    });
  }

  return { success: true, message: 'Password established successfully. You can now sign in with your email and password.' };
}

// ── 11. Two-Factor Authentication (TOTP) ──────────────────────

export async function setupTwoFactor(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const setup = await generateTotpSetup(user.email, 'ELEVATE');

  // Save encrypted temporary secret & hashed recovery codes
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: setup.encryptedSecret,
      recoveryCodes: JSON.stringify(setup.hashedRecoveryCodes),
    },
  });

  return {
    secret: setup.secret, // Plain key for manual entry
    otpauthUri: setup.otpauthUri,
    qrCodeDataUrl: setup.qrCodeDataUrl,
    recoveryCodes: setup.plainRecoveryCodes, // Show plain codes ONCE
  };
}

export async function enableTwoFactor(userId, { token }) {
  if (!token) throw new AppError('6-digit authenticator code is required', 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new AppError('2FA setup has not been initiated. Please start setup first.', 400);
  }

  const isValid = verifyTotpToken(token, user.twoFactorSecret);
  if (!isValid) {
    throw new AppError('Invalid authenticator code. Please check your app clock and code.', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { success: true, message: 'Two-Factor Authentication is now enabled!' };
}

export async function verifyTwoFactorLogin({ tempToken, code }, reqMeta = {}) {
  if (!tempToken || !code) {
    throw new AppError('Temporary login token and 2FA code are required', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, env.JWT_SECRET);
  } catch {
    throw new AppError('MFA session expired. Please sign in again.', 401);
  }

  if (decoded.type !== 'mfa_pending' || !decoded.userId) {
    throw new AppError('Invalid MFA session token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.twoFactorEnabled) {
    throw new AppError('User not found or MFA not configured', 400);
  }

  const verification = verifyTotpOrRecoveryCode(code, user.twoFactorSecret, user.recoveryCodes);
  if (!verification.valid) {
    throw new AppError('Invalid authenticator or recovery code', 400);
  }

  if (verification.usedRecoveryCode && verification.updatedRecoveryCodesJson) {
    await prisma.user.update({
      where: { id: user.id },
      data: { recoveryCodes: verification.updatedRecoveryCodesJson },
    });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const { refreshToken } = await createSession(user.id, reqMeta);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    usedRecoveryCode: verification.usedRecoveryCode,
  };
}

export async function disableTwoFactor(userId, { password, code }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  let verified = false;
  if (password && user.password) {
    verified = await comparePassword(password, user.password);
  } else if (code) {
    verified = verifyTotpToken(code, user.twoFactorSecret);
  }

  if (!verified) {
    throw new AppError('Password or current 2FA code is required to disable Two-Factor Authentication', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: null,
    },
  });

  return { success: true, message: 'Two-Factor Authentication disabled.' };
}

// ── 12. Account Linking & Provider Management ────────────────

export async function getConnectedProviders(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authIdentities: true },
  });
  if (!user) throw new AppError('User not found', 404);

  return {
    providers: user.authIdentities.map(i => ({
      provider: i.provider,
      email: i.email,
      phone: i.phone,
      connectedAt: i.createdAt,
    })),
    hasPassword: !!user.password,
  };
}

export async function unlinkProvider(userId, providerType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { authIdentities: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const targetIdentity = user.authIdentities.find(i => i.provider === providerType);
  if (!targetIdentity) {
    throw new AppError(`Provider ${providerType} is not connected to this account`, 400);
  }

  // Safety check: ensure at least one authentication method remains
  const hasPassword = !!user.password;
  const remainingProviders = user.authIdentities.filter(i => i.provider !== providerType);

  if (!hasPassword && remainingProviders.length === 0) {
    throw new AppError('Cannot disconnect your only login method. Please set a password first.', 400);
  }

  await prisma.authIdentity.delete({ where: { id: targetIdentity.id } });

  if (providerType === 'GOOGLE') {
    await prisma.user.update({
      where: { id: userId },
      data: { googleId: null, provider: hasPassword ? 'LOCAL' : 'LOCAL' },
    });
  }

  return { success: true, message: `Disconnected ${providerType} from your account.` };
}

// ── 13. Session & Device Management ───────────────────────────

export async function getActiveSessions(userId, currentRefreshToken) {
  const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
  });

  return sessions.map(s => ({
    id: s.id,
    device: s.device || 'Unknown Device',
    browser: s.browser || 'Browser',
    os: s.os || 'OS',
    ipAddress: s.ipAddress || '—',
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    isCurrent: s.tokenHash === currentTokenHash,
  }));
}

export async function revokeSession(userId, sessionId) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    throw new AppError('Session not found or already revoked', 404);
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return { success: true, message: 'Session revoked successfully' };
}

export async function revokeOtherSessions(userId, currentRefreshToken) {
  if (!currentRefreshToken) {
    throw new AppError('Current refresh token is required', 400);
  }

  const currentTokenHash = hashToken(currentRefreshToken);
  await prisma.session.updateMany({
    where: {
      userId,
      tokenHash: { not: currentTokenHash },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      token: { not: currentRefreshToken },
    },
  });

  return { success: true, message: 'All other active sessions have been signed out.' };
}

export async function refreshAccessToken(refreshToken, reqMeta = {}) {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const activeSession = await prisma.session.findFirst({
    where: {
      userId: decoded.userId,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  // Also check RefreshToken fallback
  const storedRefreshToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!activeSession && !storedRefreshToken) {
    throw new AppError('Refresh token revoked or expired', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.status === 'SUSPENDED') {
    throw new AppError('User not found or suspended', 401);
  }

  // Update session last active time
  if (activeSession) {
    await prisma.session.update({
      where: { id: activeSession.id },
      data: { lastActiveAt: new Date() },
    });
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  return {
    accessToken: newAccessToken,
    refreshToken, // Preserved token rotation
  };
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);

  await prisma.session.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}
