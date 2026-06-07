import User from '../models/User.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { fullName, username, bio, email, statusMessage } = req.body;

    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (statusMessage !== undefined) user.statusMessage = statusMessage;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload-avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    console.log('=== Avatar Upload Started ===');
    console.log('User:', req.user?._id);
    console.log('File:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'NO FILE');

    if (!isCloudinaryConfigured()) {
      console.error('Cloudinary not configured');
      return res.status(503).json({
        message:
          'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env',
      });
    }

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      console.error('Invalid mimetype:', req.file.mimetype);
      return res.status(400).json({ message: 'Invalid avatar type. Only jpg, jpeg, png, and webp are allowed.' });
    }

    console.log('Uploading to Cloudinary...');
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chattix/avatars',
          transformation: [{ width: 200, height: 200, crop: 'fill' }],
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const user = await User.findById(req.user._id);
    user.avatar = result.secure_url;
    await user.save();

    console.log('Avatar updated for user:', req.user._id);
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: result.secure_url,
      user: {
        ...user.toObject(),
        avatar: result.secure_url,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

export const uploadCover = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env',
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chattix/covers',
          transformation: [{ width: 1200, height: 400, crop: 'fill' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const user = await User.findById(req.user._id);
    user.coverImage = result.secure_url;
    await user.save();

    res.json({
      message: 'Cover image uploaded successfully',
      coverImage: result.secure_url,
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users by username, full name or email
// @route   GET /api/users/search?q=username
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || req.query.query;

    if (!query || query.trim().length < 1) {
      return res.json([]);
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
        { _id: { $ne: req.user._id } },
        { _id: { $nin: req.user.blockedUsers || [] } },
      ],
    })
      .select('fullName username avatar status email bio')
      .limit(30);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by username
// @route   GET /api/users/:username
// @access  Private
export const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('fullName username avatar bio status lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block user
// @route   POST /api/users/block/:userId
// @access  Private
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user._id);

    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock user
// @route   POST /api/users/unblock/:userId
// @access  Private
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== userId
    );
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get blocked users
// @route   GET /api/users/blocked
// @access  Private
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'blockedUsers',
      'fullName username avatar'
    );

    res.json(user.blockedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive a chat
// @route   POST /api/users/archive-chat
// @access  Private
export const archiveChat = async (req, res) => {
  try {
    const { chatId, chatType = 'user' } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    const user = await User.findById(req.user._id);

    // Check if already archived
    const isArchived = user.archivedChats.some(
      (chat) => chat.chatId.toString() === chatId.toString()
    );

    if (!isArchived) {
      user.archivedChats.push({ chatId, chatType });
      await user.save();
    }

    res.json({ message: 'Chat archived successfully', archived: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unarchive a chat
// @route   DELETE /api/users/archive-chat/:chatId
// @access  Private
export const unarchiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const user = await User.findById(req.user._id);

    user.archivedChats = user.archivedChats.filter(
      (chat) => chat.chatId.toString() !== chatId.toString()
    );

    await user.save();

    res.json({ message: 'Chat unarchived successfully', archived: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get archived chats
// @route   GET /api/users/archived-chats
// @access  Private
export const getArchivedChats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'archivedChats.chatId',
        select: 'fullName username avatar groupAvatar groupName',
      });

    res.json(user.archivedChats || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set chat wallpaper
// @route   POST /api/users/set-wallpaper
// @access  Private
export const setChatWallpaper = async (req, res) => {
  try {
    const { chatId, chatType = 'user', wallpaper, customUrl } = req.body;

    if (!chatId || !wallpaper) {
      return res.status(400).json({ message: 'Chat ID and wallpaper type are required' });
    }

    const allowedWallpapers = ['default', 'blue', 'dark', 'gradient', 'custom'];
    if (!allowedWallpapers.includes(wallpaper)) {
      return res.status(400).json({ message: 'Invalid wallpaper type' });
    }

    if (wallpaper === 'custom' && !customUrl) {
      return res.status(400).json({ message: 'Custom URL is required for custom wallpaper' });
    }

    const currentUser = await User.findById(req.user._id);

    // To make it global, we must update all participants
    let usersToUpdate = [currentUser];
    if (chatType === 'group') {
      const Group = (await import('../models/Group.js')).default;
      const group = await Group.findById(chatId);
      if (group) {
        usersToUpdate = await User.find({ _id: { $in: group.members } });
      }
    } else {
      const otherUser = await User.findById(chatId);
      if (otherUser) {
        usersToUpdate.push(otherUser);
      }
    }

    for (const u of usersToUpdate) {
      // Remove existing wallpaper for this chat
      u.chatWallpapers = u.chatWallpapers.filter(
        (cw) => cw.chatId.toString() !== chatId.toString()
      );
      // Add new wallpaper
      u.chatWallpapers.push({
        chatId,
        chatType,
        wallpaper,
        customUrl: wallpaper === 'custom' ? customUrl : undefined,
      });
      await u.save();
    }

    // Create system message
    const Message = (await import('../models/Message.js')).default;
    const systemMessageData = {
      text: `${currentUser.fullName} changed the wallpaper theme`,
      messageType: 'system',
    };
    if (chatType === 'group') {
      systemMessageData.group = chatId;
    } else {
      systemMessageData.receiver = chatId;
      systemMessageData.sender = req.user._id; // System message originated by sender
    }
    const systemMessage = await Message.create(systemMessageData);
    await systemMessage.populate([
      { path: 'sender', select: 'fullName username avatar' },
    ]);

    // Emit socket event to all participants
    const io = req.app.get('io');
    if (chatType === 'group') {
      io.to(chatId).emit('wallpaper_updated', { chatId, chatType, wallpaper, customUrl });
      io.to(chatId).emit('receive_message', systemMessage);
    } else {
      io.to(chatId).emit('wallpaper_updated', { chatId: req.user._id.toString(), chatType, wallpaper, customUrl });
      io.to(req.user._id.toString()).emit('wallpaper_updated', { chatId, chatType, wallpaper, customUrl });
      io.to(chatId).emit('receive_message', systemMessage);
      io.to(req.user._id.toString()).emit('receive_message', systemMessage);
    }

    res.json({ message: 'Wallpaper set globally', wallpaper, customUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat wallpaper
// @route   GET /api/users/wallpaper/:chatId
// @access  Private
export const getChatWallpaper = async (req, res) => {
  try {
    const { chatId } = req.params;
    const user = await User.findById(req.user._id);

    const wallpaper = user.chatWallpapers.find(
      (cw) => cw.chatId.toString() === chatId.toString()
    );

    res.json(wallpaper || { wallpaper: 'default' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update unread count for a chat
// @route   POST /api/users/unread-count
// @access  Private
export const updateUnreadCount = async (req, res) => {
  try {
    const { chatId, chatType = 'user', count } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    const user = await User.findById(req.user._id);

    // Remove existing count for this chat
    user.unreadCounts = user.unreadCounts.filter(
      (uc) => uc.chatId.toString() !== chatId.toString()
    );

    // Add new count
    user.unreadCounts.push({ chatId, chatType, count: count || 0 });

    await user.save();

    res.json({ message: 'Unread count updated', count: count || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's online status
// @route   GET /api/users/status/:userId
// @access  Private
export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('status isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const lastSeen = user.lastSeen;
    const now = new Date();
    const diffMs = now - new Date(lastSeen);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let lastSeenText = 'Offline';
    if (user.isOnline || user.status === 'online') {
      lastSeenText = 'Online';
    } else if (diffMins < 1) {
      lastSeenText = 'Last seen just now';
    } else if (diffMins < 60) {
      lastSeenText = `Last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      lastSeenText = `Last seen today at ${new Date(lastSeen).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      lastSeenText = `Last seen yesterday at ${new Date(lastSeen).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      lastSeenText = `Last seen on ${new Date(lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    res.json({
      isOnline: user.isOnline || user.status === 'online',
      status: user.status,
      lastSeen: user.lastSeen,
      lastSeenText,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search users for mentions (group members)
// @route   GET /api/users/mention-search?q=query&groupId=groupId
// @access  Private
export const searchUsersForMentions = async (req, res) => {
  try {
    const { q, groupId } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    let query = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    };

    // If groupId is provided, filter by group members
    if (groupId) {
      const Group = (await import('../models/Group.js')).default;
      const group = await Group.findById(groupId).select('members');
      if (group) {
        query._id = { $in: group.members };
      }
    }

    const users = await User.find(query)
      .select('fullName username avatar')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
