import Message from '../models/Message.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';

const includesId = (list, id) =>
  list.some((entry) => entry.toString() === id.toString());

// @desc    Send message
// @route   POST /api/messages/send
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, groupId, replyTo } = req.body;

    if (!text && !req.files && !req.body.gifUrl) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const messageData = {
      sender: req.user._id,
      text,
    };

    if (groupId) {
      const group = await Group.findById(groupId).select('members admin admins announcementMode');
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!includesId(group.members, req.user._id)) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }

      const isAdmin = group.admin.toString() === req.user._id.toString() ||
        group.admins.some((adminId) => adminId.toString() === req.user._id.toString());

      if (group.announcementMode && !isAdmin) {
        return res.status(403).json({ message: 'Announcement mode is enabled. Only group admins can send messages.' });
      }

      messageData.group = groupId;
    } else if (receiverId) {
      // Check if users are friends before allowing message
      const currentUser = await User.findById(req.user._id);
      if (!includesId(currentUser.friends, receiverId)) {
        return res.status(403).json({ 
          message: 'You can only send messages to your friends. Send a friend request first.' 
        });
      }
      messageData.receiver = receiverId;
    } else {
      return res.status(400).json({ message: 'Receiver or group required' });
    }

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    if (text) {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
      }
      
      if (mentions.length > 0) {
        const mentionedUsers = await User.find({ username: { $in: mentions } });
        if (mentionedUsers.length > 0) {
          messageData.mentions = mentionedUsers.map((u) => ({ user: u._id, username: u.username }));
        }
      }
    }

// Handle file attachments
    if (req.files && req.files.length > 0) {
      console.log('=== Media Upload Started ===');
      console.log('Number of files:', req.files.length);
      
      if (!isCloudinaryConfigured()) {
        console.error('Cloudinary not configured for media upload');
        return res.status(503).json({
          message: 'Media upload requires Cloudinary configuration in .env',
        });
      }

      const attachments = [];

      for (const file of req.files) {
        console.log('Processing file:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });

        const isAudio = file.mimetype.startsWith('audio');
        const isVideo = file.mimetype.startsWith('video');
        const isImage = file.mimetype.startsWith('image');
        const isPDF = file.mimetype === 'application/pdf';
        const isWordDoc = file.mimetype.includes('msword') || file.mimetype.includes('wordprocessingml');
        const isExcel = file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml');
        const isPowerPoint = file.mimetype.includes('mspowerpoint') || file.mimetype.includes('presentationml');
        const isZip = file.mimetype.includes('zip') || file.mimetype.includes('rar');
        const isText = file.mimetype === 'text/plain';
        
        // Determine resource type for Cloudinary
        let resourceType = 'auto';
        if (isVideo || isAudio) resourceType = 'video';
        else if (isImage) resourceType = 'image';
        else resourceType = 'raw'; // For documents, PDFs, etc.

        console.log('File type detection:', { isAudio, isVideo, isImage, isPDF, isWordDoc, isExcel, resourceType });

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: 'chattix/messages', 
              resource_type: resourceType,
              use_filename: true,
              unique_filename: true
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
          uploadStream.end(file.buffer);
        });

        let attachmentType = 'document';
        let attachmentFileType = 'document';
        
        if (isImage) {
          attachmentType = 'image';
          attachmentFileType = 'image';
        } else if (isVideo) {
          attachmentType = 'video';
          attachmentFileType = 'video';
        } else if (isAudio) {
          attachmentType = 'audio';
          attachmentFileType = 'audio';
        } else if (isPDF) {
          attachmentType = 'pdf';
          attachmentFileType = 'pdf';
        } else if (isWordDoc) {
          attachmentType = 'document';
          attachmentFileType = 'doc';
        } else if (isExcel) {
          attachmentType = 'document';
          attachmentFileType = 'xls';
        } else if (isPowerPoint) {
          attachmentType = 'document';
          attachmentFileType = 'ppt';
        } else if (isZip) {
          attachmentType = 'document';
          attachmentFileType = 'zip';
        } else if (isText) {
          attachmentType = 'document';
          attachmentFileType = 'txt';
        }

        attachments.push({
          url: result.secure_url,
          type: attachmentFileType,
          filename: file.originalname,
        });

        messageData.messageType = attachmentType;
      }

      messageData.attachments = attachments;
      console.log('All attachments uploaded successfully');
    }

    if (req.body.gifUrl) {
      if (!messageData.attachments) messageData.attachments = [];
      messageData.attachments.push({
        url: req.body.gifUrl,
        type: 'gif',
        filename: 'giphy.gif',
      });
      messageData.messageType = 'gif';
    }

    const message = await Message.create(messageData);
    await message.populate([
      { path: 'sender', select: 'fullName username avatar' },
      { path: 'replyTo', select: 'text sender attachments', populate: { path: 'sender', select: 'fullName' } },
    ]);

    const io = req.app.get('io');
    if (groupId) {
      io.to(groupId).emit('receive_message', message);
    } else {
      io.to(receiverId).emit('receive_message', message);
      await createNotification({
        recipient: receiverId,
        sender: req.user._id,
        type: 'message',
        title: 'New message',
        body: text || 'Sent an attachment',
        data: { messageId: message._id, senderId: req.user._id },
      });
      io.to(receiverId).emit('notification', { type: 'message' });
    }

    // Send notifications to mentioned users
    if (message.mentions && message.mentions.length > 0) {
      const groupInfo = groupId ? await Group.findById(groupId).select('groupName') : null;
      for (const mention of message.mentions) {
        if (mention.user.toString() !== req.user._id.toString()) {
          const mentionTitle = groupId 
            ? `Mentioned in ${groupInfo?.groupName || 'a group'}` 
            : 'You were mentioned';
          
          await createNotification({
            recipient: mention.user,
            sender: req.user._id,
            type: 'mention',
            title: mentionTitle,
            body: text,
            data: { messageId: message._id, senderId: req.user._id, groupId: groupId || undefined },
          });
          io.to(mention.user.toString()).emit('notification', { type: 'mention' });
        }
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      deleted: false,
      deletedForEveryone: { $ne: true },
      deletedFor: { $nin: [req.user._id] },
    })
      .populate('sender', 'fullName username avatar')
      .populate('receiver', 'fullName username avatar')
      .populate({
        path: 'replyTo',
        select: 'text sender attachments',
        populate: { path: 'sender', select: 'fullName username' },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      deleted: false,
    });

    const orderedMessages = messages.reverse();

    res.json({
      success: true,
      messages: Array.isArray(orderedMessages) ? orderedMessages : [],
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, messages: [], message: error.message });
  }
};

// @desc    Get group messages
// @route   GET /api/messages/group/:groupId
// @access  Private
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      group: groupId,
      deleted: false,
    })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments({
      group: groupId,
      deleted: false,
    });

    const orderedMessages = messages.reverse();

    res.json({
      success: true,
      messages: Array.isArray(orderedMessages) ? orderedMessages : [],
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ success: false, messages: [], message: error.message });
  }
};

// @desc    Mark message as delivered
// @route   PUT /api/messages/:messageId/delivered
// @access  Private
export const markAsDelivered = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { delivered: true },
      { new: true }
    );

    // Emit socket event
    const io = req.app.get('io');
    io.to(message.sender.toString()).emit('message_delivered', {
      messageId: message._id,
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as seen
// @route   PUT /api/messages/:messageId/seen
// @access  Private
export const markAsSeen = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    message.seen = true;
    message.seenBy.push({
      user: req.user._id,
      seenAt: Date.now(),
    });

    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(message.sender.toString()).emit('message_seen', {
      messageId: message._id,
      userId: req.user._id,
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/react
// @access  Private
export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const allowed = ['❤️', '👍', '😂', '🔥', '😮', '😢'];
    if (!allowed.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid reaction emoji' });
    }
    const message = await Message.findById(req.params.messageId);

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    await message.save();

    // Emit socket event
    const io = req.app.get('io');
    if (message.group) {
      io.to(message.group.toString()).emit('message_reaction', message);
    } else {
      io.to(message.receiver.toString()).emit('message_reaction', message);
      io.to(message.sender.toString()).emit('message_reaction', message);
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pin/Unpin message
// @route   PUT /api/messages/:messageId/pin
// @access  Private
export const togglePinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    message.pinned = !message.pinned;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.deleted = true;
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search?query=text
// @access  Private
export const searchMessages = async (req, res) => {
  try {
    const { query, chatId, isGroup } = req.query;
    const searchTerm = query?.trim() || '';

    if (!searchTerm) {
      return res.json([]);
    }

    const criteria = {
      text: { $regex: searchTerm, $options: 'i' },
      deleted: false,
    };

    if (isGroup === 'true' && chatId) {
      criteria.group = chatId;
    } else if (chatId) {
      criteria.$or = [
        { sender: req.user._id, receiver: chatId },
        { sender: chatId, receiver: req.user._id },
      ];
    } else {
      criteria.$or = [
        { sender: req.user._id },
        { receiver: req.user._id },
      ];
    }

    const messages = await Message.find(criteria)
      .populate('sender', 'fullName username avatar')
      .populate('receiver', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(Array.isArray(messages) ? messages : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent chats
// @route   GET /api/messages/recent
// @access  Private
export const getRecentChats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all messages where user is sender or receiver
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          group: { $exists: false },
          deleted: false,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$seen', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    // Populate user details
    await User.populate(messages, {
      path: '_id',
      select: 'fullName username avatar status lastSeen',
    });

    await User.populate(messages, {
      path: 'lastMessage.sender',
      select: 'fullName username avatar',
    });

    res.json(Array.isArray(messages) ? messages : []);
  } catch (error) {
    console.error('Get recent chats error:', error);
    res.status(500).json([]);
  }
};

export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = Date.now();
    await message.save();
    await message.populate('sender', 'fullName username avatar');

    const io = req.app.get('io');
    const target = message.receiver?.toString() || message.group?.toString();
    if (target) io.to(target).emit('message_updated', message);
    io.to(message.sender.toString()).emit('message_updated', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.deletedFor.some((id) => id.toString() === req.user._id.toString())) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteForEveryone = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.deletedForEveryone = true;
    message.text = 'This message was deleted';
    message.attachments = [];
    await message.save();

    const io = req.app.get('io');
    const targets = [message.receiver?.toString(), message.sender.toString()].filter(Boolean);
    targets.forEach((id) => io.to(id).emit('message_deleted', { messageId: message._id }));

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const original = await Message.findById(req.params.messageId);
    if (!original) return res.status(404).json({ message: 'Message not found' });

    const currentUser = await User.findById(req.user._id);
    if (!includesId(currentUser.friends, receiverId)) {
      return res.status(403).json({ message: 'Can only forward to friends' });
    }

    const forwarded = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: original.text,
      attachments: original.attachments,
      messageType: original.messageType,
      forwarded: true,
    });

    await forwarded.populate('sender', 'fullName username avatar');
    req.app.get('io').to(receiverId).emit('receive_message', forwarded);

    res.status(201).json(forwarded);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleStarMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userId = req.user._id.toString();
    const isStarred = message.starredBy.some((id) => id.toString() === userId);

    if (isStarred) {
      message.starredBy = message.starredBy.filter((id) => id.toString() !== userId);
    } else {
      message.starredBy.push(req.user._id);
    }

    await message.save();
    res.json({ starred: !isStarred, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    });

    for (const msg of messages) {
      if (!msg.deletedFor.some((id) => id.toString() === req.user._id.toString())) {
        msg.deletedFor.push(req.user._id);
        await msg.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a poll in a group
// @route   POST /api/messages/poll
// @access  Private
export const createPoll = async (req, res) => {
  try {
    const { groupId, question, options, allowMultipleVotes = false } = req.body;

    if (!groupId || !question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'Group ID, question, and at least 2 options are required' });
    }

    if (options.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 options allowed' });
    }

    const Group = (await import('../models/Group.js')).default;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!includesId(group.members, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const pollOptions = options.map((opt) => ({
      text: opt,
      votes: [],
    }));

    const message = await Message.create({
      sender: req.user._id,
      group: groupId,
      text: `📊 Poll: ${question}`,
      messageType: 'text',
      poll: {
        question,
        options: pollOptions,
        allowMultipleVotes,
        totalVotes: 0,
      },
    });

    await message.populate('sender', 'fullName username avatar');

    // Broadcast to group
    const io = req.app.get('io');
    io.to(groupId).emit('receive_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote on a poll
// @route   POST /api/messages/poll/:messageId/vote
// @access  Private
export const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (!message.poll) {
      return res.status(400).json({ message: 'This message is not a poll' });
    }

    if (!message.poll.options[optionIndex]) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    const userId = req.user._id;

    // Remove user's vote from all options first (unless multiple votes allowed)
    if (!message.poll.allowMultipleVotes) {
      for (const option of message.poll.options) {
        option.votes = option.votes.filter(
          (v) => v.toString() !== userId.toString()
        );
      }
    }

    // Add vote to selected option
    const option = message.poll.options[optionIndex];
    if (!option.votes.some((v) => v.toString() === userId.toString())) {
      option.votes.push(userId);
    }

    // Update total votes count
    const totalVotesSet = new Set();
    for (const opt of message.poll.options) {
      for (const v of opt.votes) {
        totalVotesSet.add(v.toString());
      }
    }
    message.poll.totalVotes = totalVotesSet.size;

    await message.save();
    await message.populate('sender', 'fullName username avatar');

    // Broadcast updated poll to group
    const io = req.app.get('io');
    if (message.group) {
      io.to(message.group.toString()).emit('poll_updated', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove vote from a poll
// @route   POST /api/messages/poll/:messageId/unvote
// @access  Private
export const unvotePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message || !message.poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (!message.poll.options[optionIndex]) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    const userId = req.user._id;
    const option = message.poll.options[optionIndex];
    option.votes = option.votes.filter((v) => v.toString() !== userId.toString());

    // Update total votes count
    const totalVotesSet = new Set();
    for (const opt of message.poll.options) {
      for (const v of opt.votes) {
        totalVotesSet.add(v.toString());
      }
    }
    message.poll.totalVotes = totalVotesSet.size;

    await message.save();
    await message.populate('sender', 'fullName username avatar');

    const io = req.app.get('io');
    if (message.group) {
      io.to(message.group.toString()).emit('poll_updated', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Unvote poll error:', error);
    res.status(500).json({ message: error.message });
  }
};
