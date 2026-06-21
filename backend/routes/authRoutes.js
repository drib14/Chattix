import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCurrentUser,
  updateProfileImage,
  updateProfile,
  getUserById,
} from '../controllers/authController.js';

const router = express.Router();

// Multer memory configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
});

// Get current user profile
router.get('/me', protect, getCurrentUser);

// Update profile image
router.post('/avatar', protect, upload.single('avatar'), updateProfileImage);

// Update profile info
router.put('/profile', protect, updateProfile);

// Get user by ID
router.get('/user/:userId', protect, getUserById);

export default router;
