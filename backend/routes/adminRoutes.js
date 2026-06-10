import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserActivity,
  getMessageAnalytics,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', generalLimiter, getDashboardStats);
router.get('/users', generalLimiter, getAllUsers);
router.get('/users/:userId/activity', generalLimiter, getUserActivity);
router.get('/analytics/messages', generalLimiter, getMessageAnalytics);

export default router;
