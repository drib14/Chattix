import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  allMessages,
  sendMessage,
  uploadAttachment,
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

export default router;
