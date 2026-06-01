import express from 'express';
import {
  summarizeChat,
  getSmartReplies,
  translateMessage,
  writeAssist,
  semanticSearch,
  extractActions,
  classifyMessage,
  getConversationInsights,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All AI assistant routes are protected

router.post('/summarize', summarizeChat);
router.post('/smart-replies', getSmartReplies);
router.post('/translate', translateMessage);
router.post('/write-assist', writeAssist);
router.post('/semantic-search', semanticSearch);
router.post('/action-extraction', extractActions);
router.post('/classify', classifyMessage);
router.post('/insights', getConversationInsights);

export default router;
