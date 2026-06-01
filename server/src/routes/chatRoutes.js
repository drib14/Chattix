import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  updateGroupPermissions,
  generateGroupInviteLink,
  joinGroupByInvite,
  createPollMessage,
  votePollOption,
  getGroupFiles,
  updateConversationCustomization,
  deleteConversation,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect); // All chat routes are protected

router.post('/', createConversation);
router.get('/', getConversations);
router.delete('/:conversationId', deleteConversation);
router.post('/join/:inviteToken', joinGroupByInvite);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', uploadMiddleware.single('file'), sendMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/:conversationId/messages/:messageId/pin', togglePinMessage);
router.post('/:chatId/permissions', updateGroupPermissions);
router.get('/:chatId/invite', generateGroupInviteLink);
router.post('/:chatId/poll', createPollMessage);
router.post('/:chatId/poll/:messageId/vote', votePollOption);
router.get('/:chatId/files', getGroupFiles);
router.put('/:chatId/customization', updateConversationCustomization);

export default router;
