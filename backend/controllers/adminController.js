import User from '../models/User.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'online' });
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Group.countDocuments();

    // Messages sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: today },
    });

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo },
    });

    res.json({
      totalUsers,
      activeUsers,
      totalMessages,
      totalGroups,
      messagesToday,
      newUsersThisWeek,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user activity
// @route   GET /api/admin/users/:userId/activity
// @access  Private/Admin
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messagesSent = await Message.countDocuments({ sender: userId });
    const messagesReceived = await Message.countDocuments({ receiver: userId });
    const groupsJoined = await Group.countDocuments({ members: userId });

    res.json({
      user,
      messagesSent,
      messagesReceived,
      groupsJoined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get message analytics
// @route   GET /api/admin/analytics/messages
// @access  Private/Admin
export const getMessageAnalytics = async (req, res) => {
  try {
    // Messages per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messagesPerDay = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(messagesPerDay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
