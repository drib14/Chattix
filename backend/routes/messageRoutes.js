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
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/send', upload.array('attachments', 5), sendMessage);
router.get('/recent', getRecentChats);
router.get('/search', searchMessages);
router.get('/group/:groupId', getGroupMessages);
router.put('/:messageId/edit', editMessage);
router.delete('/:messageId/me', deleteForMe);
router.delete('/:messageId/everyone', deleteForEveryone);
router.post('/:messageId/forward', forwardMessage);
router.put('/:messageId/star', toggleStarMessage);
router.delete('/clear/:userId', clearChatHistory);
router.put('/:messageId/delivered', markAsDelivered);
router.put('/:messageId/seen', markAsSeen);
router.post('/:messageId/react', addReaction);
router.put('/:messageId/pin', togglePinMessage);
router.delete('/:messageId', deleteMessage);
router.get('/:userId', getMessages);

// Poll routes
router.post('/poll', createPoll);
router.post('/poll/:messageId/vote', votePoll);
router.post('/poll/:messageId/unvote', unvotePoll);

export default router;
