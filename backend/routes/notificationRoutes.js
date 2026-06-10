import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generalLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', generalLimiter, getNotifications);
router.get('/unread-count', generalLimiter, getUnreadCount);
router.put('/read-all', generalLimiter, markAllAsRead);
router.put('/:id/read', generalLimiter, markAsRead);
router.delete('/:id', generalLimiter, deleteNotification);

export default router;
