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

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);
router.post('/logout', protect, logout);

export default router;
