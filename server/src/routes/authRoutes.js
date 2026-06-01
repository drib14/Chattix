import express from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  toggle2FA,
  verify2FALogin,
  getSessions,
  revokeSession,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.post('/verify-2fa', verify2FALogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/2fa/toggle', protect, toggle2FA);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

export default router;
