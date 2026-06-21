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
