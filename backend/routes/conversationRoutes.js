import express from 'express';
import { accessConversation, fetchConversations, createGroupConversation, updateConversationTheme } from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, accessConversation);
router.route('/').get(protect, fetchConversations);
router.route('/group').post(protect, createGroupConversation);
router.route('/theme').put(protect, updateConversationTheme);

export default router;
