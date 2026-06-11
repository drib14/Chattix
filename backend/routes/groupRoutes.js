import express from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  uploadGroupAvatar,
  removeGroupAvatar,
  addMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
  promoteToAdmin,
  demoteAdmin,
  transferAdmin,
  getGroupMembers,
  regenerateInviteCode,
  joinGroupViaInvite,
  updateGroupSettings,
  pinMessage,
  getGroupMedia,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { readLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', generalLimiter, createGroup);
router.get('/', readLimiter, getUserGroups);
router.get('/:groupId', readLimiter, getGroupById);
router.put('/:groupId', generalLimiter, updateGroup);
router.put('/:groupId/settings', generalLimiter, updateGroupSettings);
router.post('/:groupId/avatar', uploadLimiter, upload.single('avatar'), uploadGroupAvatar);
router.delete('/:groupId/avatar', generalLimiter, removeGroupAvatar);
router.post('/:groupId/members', generalLimiter, addMembers);
router.get('/:groupId/members', readLimiter, getGroupMembers);
router.delete('/:groupId/members/:memberId', generalLimiter, removeMember);
router.post('/:groupId/members/:memberId/promote', generalLimiter, promoteToAdmin);
router.post('/:groupId/members/:memberId/demote', generalLimiter, demoteAdmin);
router.post('/:groupId/transfer-admin/:newAdminId', generalLimiter, transferAdmin);
router.post('/:groupId/leave', generalLimiter, leaveGroup);
router.delete('/:groupId', generalLimiter, deleteGroup);
router.post('/:groupId/regenerate-invite', generalLimiter, regenerateInviteCode);
router.post('/:groupId/pin-message/:messageId', generalLimiter, pinMessage);
router.get('/:groupId/media', readLimiter, getGroupMedia);

// Invite code should be last route to avoid conflicts
router.post('/join/:inviteCode', generalLimiter, joinGroupViaInvite);

export default router;
