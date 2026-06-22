import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import cloudinary from '../config/cloudinary.js';
import User from '../models/User.js';

const router = express.Router();

// Synchronize and return user profile information
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Update Profile
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.file) {
      // Upload to Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: 'chattix/profiles',
      });
      updateData.avatar = uploadRes.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
});

export default router;
