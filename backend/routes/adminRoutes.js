import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserActivity,
  getMessageAnalytics,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:userId/activity', getUserActivity);
router.get('/analytics/messages', getMessageAnalytics);

export default router;
