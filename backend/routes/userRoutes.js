import express from 'express';
import { searchUsers, getMyProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, searchUsers);
router.route('/me').get(protect, getMyProfile);
router.route('/profile').put(protect, updateProfile);

export default router;
