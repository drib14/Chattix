import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// OpenGraph lightweight scraper helper
const scrapeOpenGraph = async (url) => {
  try {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'http://' + targetUrl;
    }
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(4000),
    });
    const html = await response.text();

    const getMetaTag = (property) => {
      const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
      let match = html.match(regex);
      if (match) return match[1];

      const altRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
      match = html.match(altRegex);
      return match ? match[1] : null;
    };

    const getTitle = () => {
      const ogTitle = getMetaTag('og:title');
      if (ogTitle) return ogTitle;
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1] : '';
    };

    const getDescription = () => {
      return getMetaTag('og:description') || getMetaTag('description') || '';
    };

    const getImage = () => {
      return getMetaTag('og:image') || '';
    };

    return {
      url: targetUrl,
      title: getTitle(),
      description: getDescription(),
      image: getImage(),
    };
  } catch (error) {
    console.error('OG Scraping Error:', error.message);
    return null;
  }
};

// Fetch messages for a specific conversation
export const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'fullName username avatar email isOnline')
      .populate('chat');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  const { chatId, text, attachments } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: 'chatId parameters are required' });
  }

  try {
    // Check if message text contains links
    let linkPreview = null;
    if (text) {
      const urlRegex = /(https?:\/\/[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?\b)/i;
      const match = text.match(urlRegex);
      if (match) {
        const preview = await scrapeOpenGraph(match[0]);
        if (preview && (preview.title || preview.description)) {
          linkPreview = preview;
        }
      }
    }

    const newMessage = {
      chat: chatId,
      sender: req.user._id,
      text: text || '',
      attachments: attachments || [],
      linkPreview,
    };

    let message = await Message.create(newMessage);
    message = await message.populate('sender', 'fullName username avatar email isOnline');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.participants',
      select: 'fullName username avatar email isOnline',
    });

    // Update last message in active chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

    // Emit live socket event
    if (req.io) {
      req.io.to(chatId).emit('message_received', message);
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Expose attachment uploader endpoint
export const uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const file = req.file;
    // Format buffer to base64 uri compatible with Cloudinary
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    let attachmentType = 'file';
    if (file.mimetype.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      attachmentType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      attachmentType = 'audio';
    }

    const uploadResponse = await cloudinary.uploader.upload(base64File, {
      resource_type: 'auto',
      folder: 'chattix_attachments',
    });

    res.status(200).json({
      success: true,
      attachment: {
        url: uploadResponse.secure_url,
        filename: file.originalname || 'attachment',
        type: attachmentType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload failure:', error);
    res.status(500).json({ message: 'Attachment upload failed' });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Store edit history
    message.editHistory.push({
      text: message.text,
      editedAt: new Date(),
    });

    message.text = text;
    message.isEdited = true;

    await message.save();
    await message.populate('sender', 'fullName username avatar email isOnline');

    // Emit socket event
    if (req.io) {
      req.io.to(message.chat).emit('message_edited', message);
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.text = '[This message was deleted]';
    message.attachments = [];

    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.chat).emit('message_deleted', { messageId: message._id });
    }

    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pin message
export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { chatId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Update chat's pinned messages
    const chat = await Chat.findById(chatId);
    if (message.isPinned) {
      if (!chat.pinnedMessages.includes(messageId)) {
        chat.pinnedMessages.push(messageId);
      }
    } else {
      chat.pinnedMessages = chat.pinnedMessages.filter(id => id.toString() !== messageId);
    }
    await chat.save();

    // Emit socket event
    if (req.io) {
      req.io.to(chatId).emit('message_pinned', { messageId, isPinned: message.isPinned });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetChatId } = req.body;

    const originalMessage = await Message.findById(messageId).populate('sender');
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const newMessage = new Message({
      chat: targetChatId,
      sender: req.user._id,
      text: originalMessage.text,
      attachments: originalMessage.attachments,
      linkPreview: originalMessage.linkPreview,
      forwardedFrom: {
        messageId: originalMessage._id,
        senderName: originalMessage.sender.fullName,
      },
    });

    await newMessage.save();
    await newMessage.populate('sender', 'fullName username avatar email isOnline');

    // Update last message
    await Chat.findByIdAndUpdate(targetChatId, { lastMessage: newMessage });

    // Emit socket event
    if (req.io) {
      req.io.to(targetChatId).emit('message_received', newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Find existing reaction
    let reaction = message.reactions.find(r => r.emoji === emoji);
    if (!reaction) {
      reaction = { emoji, users: [] };
      message.reactions.push(reaction);
    }

    // Add user if not already reacted
    if (!reaction.users.includes(req.user._id)) {
      reaction.users.push(req.user._id);
    }

    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.chat).emit('reaction_added', { messageId, emoji, userId: req.user._id });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Find and update reaction
    message.reactions = message.reactions.map(r => {
      if (r.emoji === emoji) {
        r.users = r.users.filter(userId => userId.toString() !== req.user._id.toString());
      }
      return r;
    });

    // Remove empty reactions
    message.reactions = message.reactions.filter(r => r.users.length > 0);

    await message.save();

    // Emit socket event
    if (req.io) {
      req.io.to(message.chat).emit('reaction_removed', { messageId, emoji, userId: req.user._id });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
