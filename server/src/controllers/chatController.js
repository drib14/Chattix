import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Create or get 1-to-1 or group conversation
// @route   POST /api/chats
// @access  Private
export const createConversation = async (req, res) => {
  const { isGroup, participants, name, avatar } = req.body;
  const currentUserId = req.user._id;

  try {
    if (isGroup) {
      if (!name) {
        return res.status(400).json({ success: false, message: 'Group name is required' });
      }
      if (!participants || participants.length < 1) {
        return res.status(400).json({ success: false, message: 'At least one participant besides you is required' });
      }

      // Add self to group participants if not already present
      const allParticipants = Array.from(new Set([...participants, currentUserId.toString()]));

      const newGroup = await Conversation.create({
        name,
        avatar: avatar || '',
        isGroup: true,
        participants: allParticipants,
        admins: [currentUserId],
      });

      const populatedGroup = await Conversation.findById(newGroup._id).populate(
        'participants',
        'username email profilePhoto statusText isOnline lastSeen'
      );

      return res.status(201).json({ success: true, conversation: populatedGroup });
    } else {
      // 1-to-1 Conversation
      const { recipientId } = req.body;
      if (!recipientId) {
        return res.status(400).json({ success: false, message: 'Recipient ID is required for 1-to-1 chat' });
      }

      // Check if conversation already exists between current user and recipient
      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, recipientId], $size: 2 },
      }).populate('participants', 'username email profilePhoto statusText isOnline lastSeen');

      if (conversation) {
        return res.status(200).json({ success: true, conversation });
      }

      // Create new 1-to-1 conversation
      const newChat = await Conversation.create({
        participants: [currentUserId, recipientId],
      });

      conversation = await Conversation.findById(newChat._id).populate(
        'participants',
        'username email profilePhoto statusText isOnline lastSeen'
      );

      return res.status(201).json({ success: true, conversation });
    }
  } catch (error) {
    console.error('[Create Conversation Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

// @desc    Get user's conversations
// @route   GET /api/chats
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username email profilePhoto statusText isOnline lastSeen')
      .populate('admins', 'username')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('[Get Conversations Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve conversations' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chats/:conversationId/messages
// @access  Private
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied or chat not found' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username email profilePhoto statusText')
      .populate({
        path: 'parentMessage',
        populate: { path: 'sender', select: 'username' },
      })
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('[Get Messages Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

// @desc    Send a message (Text or Media)
// @route   POST /api/chats/:conversationId/messages
// @access  Private
export const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { content, parentMessageId, messageType } = req.body;
  const senderId = req.user._id;

  try {
    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied or chat not found' });
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let resolvedMessageType = messageType || 'text';

    // If file is uploaded through Multer
    if (req.file) {
      const buffer = req.file.buffer;
      const originalName = req.file.originalname;
      const sizeBytes = req.file.size;

      // Determine resource type for Cloudinary
      let cloudResourceType = 'raw'; // Default for docs/files
      if (req.file.mimetype.startsWith('image/')) {
        cloudResourceType = 'image';
        resolvedMessageType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        cloudResourceType = 'video';
        resolvedMessageType = 'video';
      } else if (req.file.mimetype.startsWith('audio/')) {
        cloudResourceType = 'video'; // Cloudinary treats audio as video files for transcoding
        resolvedMessageType = 'voice';
      } else {
        resolvedMessageType = 'file';
      }

      // Stream to Cloudinary
      const uploadResult = await uploadToCloudinary(buffer, cloudResourceType);
      fileUrl = uploadResult.secure_url;
      fileName = originalName;
      fileSize = sizeBytes;
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      content: content || '',
      messageType: resolvedMessageType,
      fileUrl,
      fileName,
      fileSize,
      parentMessage: parentMessageId || null,
      readBy: [senderId],
    });

    // Update conversation lastMessage pointer
    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email profilePhoto statusText')
      .populate({
        path: 'parentMessage',
        populate: { path: 'sender', select: 'username' },
      });

    // Broadcast new message in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(conversationId).emit('message_received', populatedMessage);
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('[Send Message Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// @desc    Edit a message
// @route   PUT /api/chats/messages/:messageId
// @access  Private
export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const currentUserId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email profilePhoto statusText')
      .populate({
        path: 'parentMessage',
        populate: { path: 'sender', select: 'username' },
      });

    // Broadcast edited message in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(message.conversationId.toString()).emit('message_edited', populatedMessage);
    }

    res.status(200).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('[Edit Message Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

// @desc    Soft delete a message (delete for everyone)
// @route   DELETE /api/chats/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted.';
    message.fileUrl = '';
    message.fileName = '';
    message.fileSize = 0;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email profilePhoto statusText')
      .populate({
        path: 'parentMessage',
        populate: { path: 'sender', select: 'username' },
      });

    // Broadcast deleted message in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(message.conversationId.toString()).emit('message_deleted', populatedMessage);
    }

    res.status(200).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('[Delete Message Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

// @desc    Toggle pin status of a message inside conversation
// @route   POST /api/chats/:conversationId/messages/:messageId/pin
// @access  Private
export const togglePinMessage = async (req, res) => {
  const { conversationId, messageId } = req.params;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied or chat not found' });
    }

    const pinIndex = conversation.pinnedMessages.indexOf(messageId);
    let isPinned = false;

    if (pinIndex === -1) {
      conversation.pinnedMessages.push(messageId);
      isPinned = true;
    } else {
      conversation.pinnedMessages.splice(pinIndex, 1);
    }

    await conversation.save();

    // Broadcast pin updates in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(conversationId).emit('pinned_messages_updated', {
        conversationId,
        pinnedMessages: conversation.pinnedMessages,
      });
    }

    res.status(200).json({
      success: true,
      message: isPinned ? 'Message pinned!' : 'Message unpinned!',
      pinnedMessages: conversation.pinnedMessages,
    });
  } catch (error) {
    console.error('[Pin Message Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle pin state' });
  }
};
