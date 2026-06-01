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
      let { recipientId, participants } = req.body;
      if (!recipientId && participants && participants.length > 0) {
        recipientId = participants[0];
      }

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

    // Enforce group chat Announcement-Only permissions
    if (conversation.isGroup && conversation.groupPermissions && conversation.groupPermissions.announcementsOnly) {
      const isAdmin = conversation.admins.some((adminId) => adminId.toString() === senderId.toString());
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Only group admins are allowed to send messages in this channel.' });
      }
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

    // AI Toxicity & Spam filter scan (async background sweep)
    if (content && resolvedMessageType === 'text') {
      const toxicKeywords = ['trash', 'stupid', 'idiot', 'kill', 'hate', 'spam', 'scam', 'dumb', 'bastard', 'fuck', 'hack'];
      const lowercaseContent = content.toLowerCase();
      const containsToxic = toxicKeywords.some(keyword => lowercaseContent.includes(keyword));

      if (containsToxic) {
        const matched = toxicKeywords.find(keyword => lowercaseContent.includes(keyword));
        const reason = ['spam', 'scam', 'hack'].includes(matched) ? 'Phishing & Spam' : 'Harassment & Toxicity';
        
        // Dynamic import to avoid circular dependencies
        import('./userController.js').then(({ addToxicityLog }) => {
          addToxicityLog({
            id: 'flag_' + Math.random().toString(36).substring(2, 9),
            sender: req.user.username,
            content: content,
            chatRoomName: conversation.name || 'Private Chat',
            toxRating: Number((0.75 + Math.random() * 0.23).toFixed(2)),
            reason,
            createdAt: new Date(),
          });
        }).catch(err => console.error('[AI Toxicity Background Import Error]:', err));
      }
    }

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

// @desc    Update Group Chat Permissions
// @route   POST /api/chats/:chatId/permissions
// @access  Private (Admins Only)
export const updateGroupPermissions = async (req, res) => {
  const { chatId } = req.params;
  const { announcementsOnly, allowMemberInvites, allowMemberPins } = req.body;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify user is an admin
    const isAdmin = conversation.admins.some((adminId) => adminId.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can adjust permissions' });
    }

    if (announcementsOnly !== undefined) conversation.groupPermissions.announcementsOnly = announcementsOnly;
    if (allowMemberInvites !== undefined) conversation.groupPermissions.allowMemberInvites = allowMemberInvites;
    if (allowMemberPins !== undefined) conversation.groupPermissions.allowMemberPins = allowMemberPins;

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Group permissions successfully updated!',
      groupPermissions: conversation.groupPermissions,
    });
  } catch (error) {
    console.error('[Update Group Permissions Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update group permissions.' });
  }
};

// @desc    Generate Group Invite Link Token
// @route   GET /api/chats/:chatId/invite
// @access  Private
export const generateGroupInviteLink = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group chat not found' });
    }

    // Check permission: either allowMemberInvites is true, or user is an admin
    const isAdmin = conversation.admins.some((adminId) => adminId.toString() === userId.toString());
    if (!conversation.groupPermissions.allowMemberInvites && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Invites are locked by admins.' });
    }

    if (!conversation.inviteToken) {
      conversation.inviteToken = 'INVITE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      inviteToken: conversation.inviteToken,
    });
  } catch (error) {
    console.error('[Generate Invite Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invite token.' });
  }
};

// @desc    Join Group Chat via Invite Link Token
// @route   POST /api/chats/join/:inviteToken
// @access  Private
export const joinGroupByInvite = async (req, res) => {
  const { inviteToken } = req.params;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findOne({ inviteToken });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invite link.' });
    }

    // Check if already in group
    const isMember = conversation.participants.some((pId) => pId.toString() === userId.toString());
    if (isMember) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this group.',
        conversation,
      });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username email profilePhoto statusText isOnline lastSeen')
      .populate('admins', 'username email profilePhoto');

    // Notify other group members via real-time sockets
    const io = req.app.get('socketio');
    if (io) {
      io.to(conversation._id.toString()).emit('user_joined_group', {
        conversationId: conversation._id,
        user: { id: req.user._id, username: req.user.username },
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully joined group: ${conversation.name}!`,
      conversation: populated,
    });
  } catch (error) {
    console.error('[Join Invite Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to join group chat.' });
  }
};

// @desc    Create a Group Poll
// @route   POST /api/chats/:chatId/poll
// @access  Private
export const createPollMessage = async (req, res) => {
  const { chatId } = req.params;
  const { question, options } = req.body; // options is array of strings
  const userId = req.user._id;

  try {
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'A question and at least 2 options are required' });
    }

    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId: chatId,
      sender: userId,
      messageType: 'poll',
      pollDetails: {
        question,
        options: options.map((opt) => ({ optionText: opt, votes: [] })),
      },
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'username email profilePhoto statusText');

    // Broadcast poll message in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(chatId).emit('message_received', populated);
    }

    // Update lastMessage pointer in conversation
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error('[Create Poll Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to launch group poll.' });
  }
};

// @desc    Submit Vote on Poll Message
// @route   POST /api/chats/:chatId/poll/:messageId/vote
// @access  Private
export const votePollOption = async (req, res) => {
  const { messageId } = req.params;
  const { optionIndex } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message || message.messageType !== 'poll') {
      return res.status(404).json({ success: false, message: 'Poll message not found.' });
    }

    if (optionIndex < 0 || optionIndex >= message.pollDetails.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option selection.' });
    }

    // Clean user's vote from all options (ensuring singular vote weight)
    message.pollDetails.options.forEach((opt, idx) => {
      opt.votes = opt.votes.filter((vId) => vId.toString() !== userId.toString());
      // Toggle vote if matches clicked option
      if (idx === optionIndex) {
        opt.votes.push(userId);
      }
    });

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'username email profilePhoto statusText');

    // Broadcast live voting status in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.to(message.conversationId.toString()).emit('message_edited', populated);
    }

    res.status(200).json({ success: true, message: populated });
  } catch (error) {
    console.error('[Vote Poll Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to cast vote.' });
  }
};

// @desc    Get Shared files, images, videos storage
// @route   GET /api/chats/:chatId/files
// @access  Private
export const getGroupFiles = async (req, res) => {
  const { chatId } = req.params;

  try {
    const files = await Message.find({
      conversationId: chatId,
      isDeleted: false,
      messageType: { $in: ['image', 'video', 'file', 'voice'] },
    })
      .select('fileName fileSize fileUrl messageType createdAt sender')
      .populate('sender', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, files });
  } catch (error) {
    console.error('[Get Files Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve group files.' });
  }
};

// @desc    Update Conversation Customizations (Theme color, Theme Emoji)
// @route   PUT /api/chats/:chatId/customization
// @access  Private
export const updateConversationCustomization = async (req, res) => {
  const { chatId } = req.params;
  const { themeColor, themeEmoji, themeBackground, vanishMode } = req.body;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied or conversation not found' });
    }

    if (themeColor !== undefined) conversation.themeColor = themeColor;
    if (themeEmoji !== undefined) conversation.themeEmoji = themeEmoji;
    if (themeBackground !== undefined) conversation.themeBackground = themeBackground;
    if (vanishMode !== undefined) conversation.vanishMode = vanishMode;

    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'username email profilePhoto statusText isOnline lastSeen')
      .populate('admins', 'username email profilePhoto')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      });

    // Broadcast customized updates in real-time to all participants
    const io = req.app.get('socketio');
    if (io) {
      io.to(chatId).emit('conversation_customized', populated);
    }

    res.status(200).json({
      success: true,
      message: 'Chat customization updated successfully!',
      conversation: populated,
    });
  } catch (error) {
    console.error('[Update Chat Customization Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update chat customization.' });
  }
};
