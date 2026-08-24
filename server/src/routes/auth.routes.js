import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  appleAuthSchema,
  microsoftAuthSchema,
  phoneSendOtpSchema,
  phoneVerifyOtpSchema,
  emailOtpSendSchema,
  emailOtpVerifySchema,
  magicLinkSendSchema,
  magicLinkVerifySchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  setPasswordSchema,
  mfaEnableSchema,
  mfaVerifyLoginSchema,
  mfaDisableSchema,
} from '../validators/auth.validator.js';

const router = Router();

// ── Public Authentication Endpoints ──
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);
router.post('/apple', validate(appleAuthSchema), authController.appleAuth);
router.post('/microsoft', validate(microsoftAuthSchema), authController.microsoftAuth);

// Mobile SMS OTP
router.post('/otp/phone/send', validate(phoneSendOtpSchema), authController.phoneSendOtp);
router.post('/otp/phone/verify', validate(phoneVerifyOtpSchema), authController.phoneVerifyOtp);
router.post('/otp/send', validate(phoneSendOtpSchema), authController.phoneSendOtp); // alias
router.post('/otp/verify', validate(phoneVerifyOtpSchema), authController.phoneVerifyOtp); // alias

// Email OTP
router.post('/otp/email/send', validate(emailOtpSendSchema), authController.emailOtpSend);
router.post('/otp/email/verify', validate(emailOtpVerifySchema), authController.emailOtpVerify);

// Magic Link
router.post('/magic-link/send', validate(magicLinkSendSchema), authController.magicLinkSend);
router.post('/magic-link/verify', validate(magicLinkVerifySchema), authController.magicLinkVerify);

// Email Verification & Password Reset
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// MFA Login Challenge Verification
router.post('/mfa/verify', validate(mfaVerifyLoginSchema), authController.mfaVerify);

// Session Refresh & Logout
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ── Protected Authenticated Endpoints ──
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateMe);

// Password Management
router.patch('/password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.patch('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword); // alias
router.post('/set-password', authenticate, validate(setPasswordSchema), authController.setPassword);

// Two-Factor Authentication (2FA)
router.post('/mfa/setup', authenticate, authController.mfaSetup);
router.post('/mfa/enable', authenticate, validate(mfaEnableSchema), authController.mfaEnable);
router.post('/mfa/disable', authenticate, validate(mfaDisableSchema), authController.mfaDisable);

// Account Linking & Provider Management
router.get('/providers', authenticate, authController.getProviders);
router.delete('/providers/:provider', authenticate, authController.unlinkProvider);

// Active Sessions & Device Management
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.delete('/sessions', authenticate, authController.revokeOtherSessions);

export default router;
