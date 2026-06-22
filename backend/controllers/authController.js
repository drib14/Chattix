import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// Get current user profile
export const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// Update profile image
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar from Cloudinary if it exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.log('Error deleting old avatar:', err);
      }
    }

    // Upload new avatar
    const file = req.file;
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const uploadResponse = await cloudinary.uploader.upload(base64File, {
      folder: 'chattix_avatars',
      resource_type: 'auto',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }
      ]
    });

    user.avatar = uploadResponse.secure_url;
    user.avatarPublicId = uploadResponse.public_id;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated',
      user,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, status } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (status && ['available', 'away', 'busy', 'offline'].includes(status)) {
      user.status = status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-clerkId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
