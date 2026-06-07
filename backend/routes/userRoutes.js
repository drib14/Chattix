import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAccount,
  searchUsers,
  getUserByUsername,
  blockUser,
  unblockUser,
  getBlockedUsers,
  changePassword,
  archiveChat,
  unarchiveChat,
  getArchivedChats,
  setChatWallpaper,
  getChatWallpaper,
  updateUnreadCount,
  getUserStatus,
  searchUsersForMentions,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfile } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-avatar', uploadProfile.single('avatar'), uploadAvatar);
router.post('/avatar', uploadProfile.single('avatar'), uploadAvatar);
router.post('/upload-cover', uploadProfile.single('coverImage'), uploadCover);
router.delete('/delete', deleteAccount);
router.get('/search', searchUsers);
router.get('/blocked', getBlockedUsers);
router.post('/block/:userId', blockUser);
router.post('/unblock/:userId', unblockUser);
router.put('/change-password', changePassword);

// Archive chat routes
router.post('/archive-chat', archiveChat);
router.delete('/archive-chat/:chatId', unarchiveChat);
router.get('/archived-chats', getArchivedChats);

// Wallpaper routes
router.post('/set-wallpaper', setChatWallpaper);
router.get('/wallpaper/:chatId', getChatWallpaper);

// Unread count route
router.post('/unread-count', updateUnreadCount);

// User status route
router.get('/status/:userId', getUserStatus);

// Mention search route
router.get('/mention-search', searchUsersForMentions);

router.get('/:username', getUserByUsername);

export default router;
