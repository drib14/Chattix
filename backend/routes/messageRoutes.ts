import express from 'express';
import { allMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:conversationId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);

export default router;