import User from '../models/User.js';
import { createNotification } from './notificationController.js';

const includesId = (list, id) =>
  list.some((entry) => entry.toString() === id.toString());

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (includesId(currentUser.friends, userId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already sent
    if (includesId(currentUser.sentRequests, userId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if user has already sent request to current user
    if (includesId(currentUser.pendingRequests, userId)) {
      return res.status(400).json({ message: 'This user has already sent you a friend request' });
    }

    // Add to sent requests and pending requests
    currentUser.sentRequests.push(userId);
    user.pendingRequests.push(currentUserId);

    await currentUser.save();
    await user.save();

    // Emit socket event
    const io = req.app.get('io');
    const payload = {
      from: {
        _id: currentUser._id,
        fullName: currentUser.fullName,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
    };
    io.to(userId).emit('friend_request', payload);
    io.to(userId).emit('friend_request_received', payload);

    await createNotification({
      recipient: userId,
      sender: currentUserId,
      type: 'friend_request',
      title: 'Friend request',
      body: `${currentUser.fullName} sent you a friend request`,
      data: { fromId: currentUserId },
    });
    io.to(userId).emit('notification', { type: 'friend_request' });

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept/:userId
// @access  Private
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if request exists
    if (!includesId(currentUser.pendingRequests, userId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add to friends
    currentUser.friends.push(userId);
    user.friends.push(currentUserId);

    // Remove from pending and sent requests
    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      (id) => id.toString() !== userId
    );
    user.sentRequests = user.sentRequests.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await user.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(userId).emit('friend_request_accepted', {
      from: {
        _id: currentUser._id,
        fullName: currentUser.fullName,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
    });

    await createNotification({
      recipient: userId,
      sender: currentUserId,
      type: 'friend_accepted',
      title: 'Friend request accepted',
      body: `${currentUser.fullName} accepted your friend request`,
      data: { fromId: currentUserId },
    });

    res.json({
      message: 'Friend request accepted',
      friend: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject friend request
// @route   POST /api/friends/reject/:userId
// @access  Private
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from pending and sent requests
    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      (id) => id.toString() !== userId
    );
    user.sentRequests = user.sentRequests.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await user.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel friend request
// @route   DELETE /api/friends/cancel/:userId
// @access  Private
export const cancelFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from sent and pending requests
    currentUser.sentRequests = currentUser.sentRequests.filter(
      (id) => id.toString() !== userId
    );
    user.pendingRequests = user.pendingRequests.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await user.save();

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:userId
// @access  Private
export const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from friends
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== userId
    );
    user.friends = user.friends.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await user.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'fullName username avatar status lastSeen bio'
    );

    res.json(user.friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending friend requests
// @route   GET /api/friends/requests/pending
// @access  Private
export const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'pendingRequests',
      'fullName username avatar bio'
    );

    res.json(user.pendingRequests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sent friend requests
// @route   GET /api/friends/requests/sent
// @access  Private
export const getSentRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'sentRequests',
      'fullName username avatar bio'
    );

    res.json(user.sentRequests);
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check friendship status
// @route   GET /api/friends/status/:userId
// @access  Private
export const getFriendshipStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);

    const isFriend = includesId(currentUser.friends, userId);
    const requestSent = includesId(currentUser.sentRequests, userId);
    const requestReceived = includesId(currentUser.pendingRequests, userId);

    res.json({
      isFriend,
      requestSent,
      requestReceived,
    });
  } catch (error) {
    console.error('Get friendship status error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMutualFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(userId);

    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    const mutualIds = currentUser.friends.filter((id) =>
      otherUser.friends.some((fid) => fid.toString() === id.toString())
    );

    const mutual = await User.find({ _id: { $in: mutualIds } }).select(
      'fullName username avatar'
    );

    res.json(Array.isArray(mutual) ? mutual : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
