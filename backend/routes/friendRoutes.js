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

const router = express.Router();

router.use(protect);

router.get('/', getFriends);
router.get('/requests/pending', getPendingRequests);
router.get('/requests/sent', getSentRequests);
router.get('/status/:userId', getFriendshipStatus);
router.get('/mutual/:userId', getMutualFriends);
router.post('/request/:userId', sendFriendRequest);
router.post('/accept/:userId', acceptFriendRequest);
router.post('/reject/:userId', rejectFriendRequest);
router.delete('/cancel/:userId', cancelFriendRequest);
router.delete('/:userId', removeFriend);

export default router;
