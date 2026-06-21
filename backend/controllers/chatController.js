import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Access or create 1-to-1 chat room
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    // Check if chat already exists
    let isChat = await Chat.find({
      isGroup: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('participants', '-clerkId')
      .populate('lastMessage');

    isChat = await User.populate(isChat, {
      path: 'lastMessage.sender',
      select: 'fullName username avatar email isOnline',
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      // Create new chat
      const chatData = {
        groupName: 'sender',
        isGroup: false,
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'participants',
        '-clerkId'
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch chats for the current user
export const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', '-clerkId')
      .populate('admins', '-clerkId')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'lastMessage.sender',
      select: 'fullName username avatar email isOnline',
    });

    res.status(200).send(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a group chat room
export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: 'Group name and users list are required' });
  }

  let parsedUsers;
  try {
    parsedUsers = typeof users === 'string' ? JSON.parse(users) : users;
  } catch (e) {
    return res.status(400).json({ message: 'Invalid users parameter format' });
  }

  if (parsedUsers.length < 1) {
    return res.status(400).json({ message: 'A group requires at least 2 users' });
  }

  // Include the active creator user
  parsedUsers.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      groupName: name,
      isGroup: true,
      participants: parsedUsers,
      admins: [req.user._id],
      groupAvatar: `https://ui-avatars.com/api/?background=4F46E5&color=fff&bold=true&name=${encodeURIComponent(name)}`,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('participants', '-clerkId')
      .populate('admins', '-clerkId');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search users in Chattix network to connect
export const searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { fullName: { $regex: req.query.search, $options: 'i' } },
          { username: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  try {
    // Search excluding current user
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('-clerkId');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set chat nickname for a user
export const setChatNickname = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, nickname } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is in this chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'User not in this chat' });
    }

    // Find or create nickname entry
    let nicknameEntry = chat.nicknames.find(n => n.user.toString() === userId);
    if (!nicknameEntry) {
      chat.nicknames.push({ user: userId, nickname });
    } else {
      nicknameEntry.nickname = nickname;
    }

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pin or unpin chat
export const togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const userId = req.user._id;
    const isPinnedByUser = chat.isPinned.includes(userId);

    if (isPinnedByUser) {
      chat.isPinned = chat.isPinned.filter(id => id.toString() !== userId.toString());
    } else {
      chat.isPinned.push(userId);
    }

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pinned messages for a chat
export const getPinnedMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).populate({
      path: 'pinnedMessages',
      populate: { path: 'sender', select: 'fullName username avatar' },
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.status(200).json(chat.pinnedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shared media in chat
export const getSharedMedia = async (req, res) => {
  try {
    const { chatId } = req.params;
    const Message = require('../models/Message.js').default;

    const mediaMessages = await Message.find({
      chat: chatId,
      $or: [
        { 'attachments.type': { $in: ['image', 'video'] } },
        { linkPreview: { $exists: true, $ne: null } },
      ],
    })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(mediaMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shared files in chat
export const getSharedFiles = async (req, res) => {
  try {
    const { chatId } = req.params;
    const Message = require('../models/Message.js').default;

    const fileMessages = await Message.find({
      chat: chatId,
      'attachments.type': { $in: ['file', 'audio'] },
    })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(fileMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shared links in chat
export const getSharedLinks = async (req, res) => {
  try {
    const { chatId } = req.params;
    const Message = require('../models/Message.js').default;

    const linkMessages = await Message.find({
      chat: chatId,
      linkPreview: { $exists: true, $ne: null },
    })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(linkMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
