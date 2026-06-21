import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  accessChat,
  fetchChats,
  createGroupChat,
  searchUsers,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.get('/users', protect, searchUsers);

export default router;
