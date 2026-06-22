import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  searchUsers,
  updateChatSettings,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.get('/users', protect, searchUsers);
router.put('/:chatId', protect, updateChatSettings);

export default router;
