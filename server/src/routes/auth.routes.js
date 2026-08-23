import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
  sendOtp,
  verifyOtp,
  googleAuth,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/otp/send', validate(sendOtpSchema), sendOtp);
router.post('/otp/verify', validate(verifyOtpSchema), verifyOtp);
router.post('/google', googleAuth);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.patch('/password', authenticate, changePassword);

export default router;
