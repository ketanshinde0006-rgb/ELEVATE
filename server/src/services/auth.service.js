import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import env from '../config/env.js';
import { AppError } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 12;

// In-memory OTP storage for phone verification: phone -> { otp, expiresAt }
const otpCache = new Map();

/**
 * Hash a password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token and store in DB
 */
export async function generateRefreshToken(userId) {
  const token = jwt.sign({ userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

  // Parse expiry from JWT_REFRESH_EXPIRES_IN (e.g., '7d')
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  let ms = 7 * 24 * 60 * 60 * 1000; // default 7 days
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    ms = val * (multipliers[unit] || 86400000);
  }

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + ms),
    },
  });

  return token;
}

/**
 * Send Phone OTP for mobile verification
 */
export function sendPhoneOtp(phone) {
  if (!phone || phone.trim().length < 8) {
    throw new AppError('Enter a valid mobile number', 400);
  }

  const cleanPhone = phone.trim().replace(/[\s-]/g, '');
  // Generate random 6-digit OTP code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(cleanPhone, {
    otp: generatedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return {
    phone: cleanPhone,
    otp: generatedOtp, // returned for developer/user convenience in demo mode
    message: `OTP sent successfully to ${cleanPhone}`,
  };
}

/**
 * Verify OTP and Register user with Mobile Number
 */
export async function verifyOtpAndRegister({ phone, otp, password, firstName, lastName, email }) {
  if (!phone) throw new AppError('Mobile number is required', 400);
  const cleanPhone = phone.trim().replace(/[\s-]/g, '');

  const record = otpCache.get(cleanPhone);
  // Accept generated OTP or universal testing master OTP 123456
  const isValid = otp === '123456' || (record && record.otp === otp && record.expiresAt >= Date.now());
  if (!isValid) {
    throw new AppError('Invalid or expired OTP code', 400);
  }

  // Invalidate consumed OTP
  otpCache.delete(cleanPhone);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: cleanPhone },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existing) {
    throw new AppError('Mobile number or email is already registered', 409);
  }

  const generatedEmail = email || `${cleanPhone.replace(/[^0-9]/g, '')}@mobile.elevate`;
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: generatedEmail,
      phone: cleanPhone,
      password: hashedPassword,
      firstName: firstName || 'Member',
      lastName: lastName || '',
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

/**
 * Register a new user with Email (or Phone)
 */
export async function registerUser({ email, phone, password, firstName, lastName }) {
  const cleanPhone = phone ? phone.trim().replace(/[\s-]/g, '') : null;
  const userEmail = email ? email.trim().toLowerCase() : `${cleanPhone.replace(/[^0-9]/g, '')}@mobile.elevate`;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: userEmail },
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
      ],
    },
  });

  if (existing) {
    throw new AppError('Email or mobile number is already registered', 409);
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      phone: cleanPhone,
      password: hashedPassword,
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
}

/**
 * Login user via Email OR Mobile Number and Password
 */
export async function loginUser({ email, phone, identifier, password }) {
  const loginKey = (identifier || email || phone || '').trim();
  if (!loginKey) {
    throw new AppError('Email or mobile number is required', 400);
  }

  const cleanPhoneKey = loginKey.replace(/[\s-]/g, '');

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginKey.toLowerCase() },
        { phone: cleanPhoneKey },
        { phone: loginKey },
        { email: `${cleanPhoneKey.replace(/[^0-9]/g, '')}@mobile.elevate` },
      ],
    },
  });

  if (!user) {
    throw new AppError('Invalid credentials. Please check your email/mobile and password.', 401);
  }

  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    throw new AppError('Invalid credentials. Please check your email/mobile and password.', 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

/**
 * Google Login or Register
 */
export async function googleLoginOrRegister({ email, firstName, lastName, avatar }) {
  if (!email) throw new AppError('Google email required', 400);
  const normalizedEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    const randomPassword = await hashPassword(Math.random().toString(36) + 'Aa1!Elevate');
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: randomPassword,
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        avatar: avatar || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshTokenStr) {
  if (!refreshTokenStr) {
    throw new AppError('Refresh token required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenStr },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw new AppError('Refresh token expired', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = await generateRefreshToken(user.id);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — remove refresh token
 */
export async function logoutUser(refreshTokenStr) {
  if (refreshTokenStr) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshTokenStr } });
  }
}
