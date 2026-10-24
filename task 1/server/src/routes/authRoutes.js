import express from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  updateTheme,
  logout,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
} from '../middleware/validate.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public auth routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/verify-otp', authLimiter, validateVerifyOtp, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);

// Authenticated user routes
router.get('/me', authenticateToken, getMe);
router.patch('/theme', authenticateToken, updateTheme);
router.post('/logout', authenticateToken, logout);

export default router;
