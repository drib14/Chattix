import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  allMessages,
  sendMessage,
  uploadAttachment,
  deleteMessage,
} from '../controllers/messageController.js';

const router = express.Router();

// Multer memory configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/:chatId', protect, allMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadAttachment);
router.delete('/:id', protect, deleteMessage);

// Message CRUD operations
router.put('/:messageId/edit', protect, editMessage);
router.delete('/:messageId/delete', protect, deleteMessage);
router.put('/:messageId/pin', protect, pinMessage);
router.post('/:messageId/forward', protect, forwardMessage);

// Reactions
router.post('/:messageId/reactions/add', protect, addReaction);
router.delete('/:messageId/reactions/remove', protect, removeReaction);

export default router;
