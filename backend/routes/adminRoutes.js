import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserActivity,
  getMessageAnalytics,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { readLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', readLimiter, getDashboardStats);
router.get('/users', readLimiter, getAllUsers);
router.get('/users/:userId/activity', readLimiter, getUserActivity);
router.get('/analytics/messages', readLimiter, getMessageAnalytics);

export default router;
