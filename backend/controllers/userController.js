import { User } from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  try {
    const users = await User.find(keyword).find({ _id: { $ne: req.user?._id } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, profilePic, theme } = req.body;
    const user = await User.findById(req.user?._id);

    if (user) {
      if (username) user.username = username;
      if (profilePic !== undefined) user.profilePic = profilePic;
      if (theme) user.theme = theme;

      const updatedUser = await user.save();
      
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        theme: updatedUser.theme,
        token: token
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload an image file' });
      return;
    }

    const fileStr = req.file.buffer.toString('base64');
    const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;

    const uploadResponse = await cloudinary.uploader.upload(fileUri, {
      folder: 'chattix_profiles',
    });

    const user = await User.findById(req.user?._id);
    if (user) {
      user.profilePic = uploadResponse.secure_url;
      const updatedUser = await user.save();
      
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        theme: updatedUser.theme,
        token: token,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
