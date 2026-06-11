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
  reportUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfile } from '../middleware/uploadMiddleware.js';
import { readLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', readLimiter, getProfile);
router.put('/profile', generalLimiter, updateProfile);
router.post('/upload-avatar', uploadLimiter, uploadProfile.single('avatar'), uploadAvatar);
router.post('/avatar', uploadLimiter, uploadProfile.single('avatar'), uploadAvatar);
router.post('/upload-cover', uploadLimiter, uploadProfile.single('coverImage'), uploadCover);
router.delete('/delete', generalLimiter, deleteAccount);
router.get('/search', readLimiter, searchUsers);
router.get('/blocked', readLimiter, getBlockedUsers);
router.post('/block/:userId', generalLimiter, blockUser);
router.post('/unblock/:userId', generalLimiter, unblockUser);
router.post('/report/:userId', generalLimiter, reportUser);
router.put('/change-password', generalLimiter, changePassword);

// Archive chat routes
router.post('/archive-chat', generalLimiter, archiveChat);
router.delete('/archive-chat/:chatId', generalLimiter, unarchiveChat);
router.get('/archived-chats', readLimiter, getArchivedChats);

// Wallpaper routes
router.post('/set-wallpaper', generalLimiter, setChatWallpaper);
router.get('/wallpaper/:chatId', readLimiter, getChatWallpaper);

// Unread count route
router.post('/unread-count', generalLimiter, updateUnreadCount);

// User status route
router.get('/status/:userId', readLimiter, getUserStatus);

// Mention search route
router.get('/mention-search', readLimiter, searchUsersForMentions);

router.get('/:username', readLimiter, getUserByUsername);

export default router;
