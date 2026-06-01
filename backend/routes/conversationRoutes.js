import express from 'express';
import { accessConversation, fetchConversations, createGroupConversation } from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, accessConversation);
router.route('/').get(protect, fetchConversations);
router.route('/group').post(protect, createGroupConversation);

export default router;
