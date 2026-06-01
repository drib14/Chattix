import express from 'express';
import {
  searchUsers,
  updateProfile,
  getContacts,
  sendContactRequest,
  acceptContactRequest,
  rejectContactRequest,
  toggleFavorite,
  removeContact,
  updatePrivacySettings,
  blockUser,
  unblockUser,
  setContactCategory,
  changeUsername,
  getAdminAnalytics,
  toggleSuspendUser,
  getToxicityLogs,
  uploadCustomSticker,
  getCustomStickers,
  createStory,
  getStories,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect); // All user and contact routes are protected

router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.put('/username', changeUsername);
router.put('/privacy', updatePrivacySettings);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.put('/contacts/category', setContactCategory);
router.get('/contacts', getContacts);
router.post('/contacts/request', sendContactRequest);
router.post('/contacts/accept', acceptContactRequest);
router.post('/contacts/reject', rejectContactRequest);
router.post('/contacts/favorite', toggleFavorite);
router.delete('/contacts/:id', removeContact);

// Custom Stickers & Stories Routes
router.post('/stickers', uploadMiddleware.single('file'), uploadCustomSticker);
router.get('/stickers', getCustomStickers);
router.post('/stories', createStory);
router.get('/stories', getStories);

// Admin Routes
router.get('/admin/analytics', getAdminAnalytics);
router.put('/admin/users/:id/suspend', toggleSuspendUser);
router.get('/admin/toxicity', getToxicityLogs);

export default router;
