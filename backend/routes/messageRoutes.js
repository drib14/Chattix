import express from 'express';
import {
  sendMessage,
  getMessages,
  getGroupMessages,
  markAsDelivered,
  markAsSeen,
  addReaction,
  togglePinMessage,
  deleteMessage,
  searchMessages,
  getRecentChats,
  editMessage,
  deleteForMe,
  deleteForEveryone,
  forwardMessage,
  toggleStarMessage,
  clearChatHistory,
  createPoll,
  votePoll,
  unvotePoll,
  deleteConversation,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { messageLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/send', uploadLimiter, upload.array('attachments', 5), sendMessage);
router.get('/recent', generalLimiter, getRecentChats);
router.get('/search', generalLimiter, searchMessages);
router.get('/group/:groupId', generalLimiter, getGroupMessages);
router.put('/:messageId/edit', messageLimiter, editMessage);
router.delete('/:messageId/me', messageLimiter, deleteForMe);
router.delete('/:messageId/everyone', messageLimiter, deleteForEveryone);
router.post('/:messageId/forward', messageLimiter, forwardMessage);
router.put('/:messageId/star', messageLimiter, toggleStarMessage);
router.delete('/clear/:userId', generalLimiter, clearChatHistory);
router.delete('/conversation/:userId', generalLimiter, deleteConversation);
router.put('/:messageId/delivered', messageLimiter, markAsDelivered);
router.put('/:messageId/seen', messageLimiter, markAsSeen);
router.post('/:messageId/react', messageLimiter, addReaction);
router.put('/:messageId/pin', messageLimiter, togglePinMessage);
router.delete('/:messageId', messageLimiter, deleteMessage);
router.get('/:userId', generalLimiter, getMessages);

// Poll routes
router.post('/poll', messageLimiter, createPoll);
router.post('/poll/:messageId/vote', messageLimiter, votePoll);
router.post('/poll/:messageId/unvote', messageLimiter, unvotePoll);

export default router;
