import express from 'express';
import { searchUsers, getMyProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, searchUsers);
router.route('/me').get(protect, getMyProfile);

export default router;