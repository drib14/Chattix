import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect); // All chat routes are protected

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', uploadMiddleware.single('file'), sendMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/:conversationId/messages/:messageId/pin', togglePinMessage);

export default router;
