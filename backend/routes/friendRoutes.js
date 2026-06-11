import express from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getFriendshipStatus,
  getMutualFriends,
} from '../controllers/friendController.js';
import { protect } from '../middleware/authMiddleware.js';
import { readLimiter, generalLimiter, friendRequestLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', readLimiter, getFriends);
router.get('/requests/pending', readLimiter, getPendingRequests);
router.get('/requests/sent', readLimiter, getSentRequests);
router.get('/status/:userId', readLimiter, getFriendshipStatus);
router.get('/mutual/:userId', readLimiter, getMutualFriends);
router.post('/request/:userId', friendRequestLimiter, sendFriendRequest);
router.post('/accept/:userId', friendRequestLimiter, acceptFriendRequest);
router.post('/reject/:userId', friendRequestLimiter, rejectFriendRequest);
router.delete('/cancel/:userId', friendRequestLimiter, cancelFriendRequest);
router.delete('/:userId', generalLimiter, removeFriend);

export default router;
