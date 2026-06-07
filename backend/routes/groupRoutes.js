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

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/:groupId', getGroupById);
router.put('/:groupId', updateGroup);
router.put('/:groupId/settings', updateGroupSettings);
router.post('/:groupId/avatar', upload.single('avatar'), uploadGroupAvatar);
router.delete('/:groupId/avatar', removeGroupAvatar);
router.post('/:groupId/members', addMembers);
router.get('/:groupId/members', getGroupMembers);
router.delete('/:groupId/members/:memberId', removeMember);
router.post('/:groupId/members/:memberId/promote', promoteToAdmin);
router.post('/:groupId/members/:memberId/demote', demoteAdmin);
router.post('/:groupId/transfer-admin/:newAdminId', transferAdmin);
router.post('/:groupId/leave', leaveGroup);
router.delete('/:groupId', deleteGroup);
router.post('/:groupId/regenerate-invite', regenerateInviteCode);
router.post('/:groupId/pin-message/:messageId', pinMessage);
router.get('/:groupId/media', getGroupMedia);

// Invite code should be last route to avoid conflicts
router.post('/join/:inviteCode', joinGroupViaInvite);

export default router;
