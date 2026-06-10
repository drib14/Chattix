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
import { generalLimiter, friendRequestLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', generalLimiter, getFriends);
router.get('/requests/pending', generalLimiter, getPendingRequests);
router.get('/requests/sent', generalLimiter, getSentRequests);
router.get('/status/:userId', generalLimiter, getFriendshipStatus);
router.get('/mutual/:userId', generalLimiter, getMutualFriends);
router.post('/request/:userId', friendRequestLimiter, sendFriendRequest);
router.post('/accept/:userId', friendRequestLimiter, acceptFriendRequest);
router.post('/reject/:userId', friendRequestLimiter, rejectFriendRequest);
router.delete('/cancel/:userId', friendRequestLimiter, cancelFriendRequest);
router.delete('/:userId', generalLimiter, removeFriend);

export default router;
