import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  searchUsers,
  setChatNickname,
  togglePinChat,
  getPinnedMessages,
  getSharedMedia,
  getSharedFiles,
  getSharedLinks,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.get('/users', protect, searchUsers);

// Chat tools
router.put('/:chatId/nickname', protect, setChatNickname);
router.put('/:chatId/pin', protect, togglePinChat);
router.get('/:chatId/pinned-messages', protect, getPinnedMessages);
router.get('/:chatId/media', protect, getSharedMedia);
router.get('/:chatId/files', protect, getSharedFiles);
router.get('/:chatId/links', protect, getSharedLinks);

export default router;
