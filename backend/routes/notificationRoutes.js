import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { notificationLimiter, generalLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', notificationLimiter, getNotifications);
router.get('/unread-count', notificationLimiter, getUnreadCount);
router.put('/read-all', generalLimiter, markAllAsRead);
router.put('/:id/read', generalLimiter, markAsRead);
router.delete('/:id', generalLimiter, deleteNotification);

export default router;
