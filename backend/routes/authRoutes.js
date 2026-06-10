import express from 'express';
import {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  resendOTP,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Apply strict rate limiting to all auth routes
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/logout', protect, logout);

export default router;
