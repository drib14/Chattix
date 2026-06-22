const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const upload = require('../middleware/upload');
const axios = require('axios');
const { checkAuth } = require('../middleware/auth');

// --- Helper: Get DB User ---
// In custom JWT auth, req.user.id is already the MongoDB _id
const getDbUser = async (reqUserId) => {
  return await User.findById(reqUserId);
};

// --- User Search ---
router.get('/users/search', checkAuth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude self
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
          ]
        }
      ]
    }).select('firstName lastName username profileImageUrl isOnline lastSeen');

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Conversations ---

// Get all conversations for current user
router.get('/conversations', checkAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'firstName lastName username profileImageUrl isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or get existing conversation
router.post('/conversations', checkAuth, async (req, res) => {
  try {
    const { participantId } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] } // strictly 2 participants
    }).populate('participants', 'firstName lastName username profileImageUrl isOnline lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId]
      });
      conversation = await conversation.populate('participants', 'firstName lastName username profileImageUrl isOnline lastSeen');
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Messages ---

// Get messages for a conversation
router.get('/messages/:conversationId', checkAuth, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'firstName lastName profileImageUrl')
      .populate({
        path: 'replyTo',
        select: 'content type senderId',
        populate: { path: 'senderId', select: 'firstName' }
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message (handles all types)
router.post('/messages', checkAuth, upload.single('media'), async (req, res) => {
  try {
    const { conversationId, type, content, replyTo, forwarded, linkPreview } = req.body;

    let finalContent = content;

    // If a file was uploaded, the content URL comes from Cloudinary
    if (req.file) {
      finalContent = req.file.path;
    }

    let parsedLinkPreview = null;
    if (linkPreview) {
      try { parsedLinkPreview = JSON.parse(linkPreview); } catch(e){}
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: req.user.id,
      type: type || (req.file ? (req.file.mimetype.split('/')[0]) : 'text'),
      content: finalContent,
      replyTo: replyTo || null,
      forwarded: forwarded === 'true' || forwarded === true,
      linkPreview: parsedLinkPreview
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName profileImageUrl')
      .populate({
        path: 'replyTo',
        select: 'content type senderId',
        populate: { path: 'senderId', select: 'firstName' }
      });

    // Update conversation lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      updatedAt: Date.now()
    });

    // --- Emit Socket Event ---
    const conversation = await Conversation.findById(conversationId);
    conversation.participants.forEach(participantId => {
      const pIdStr = participantId.toString();
      const socketId = req.userSocketMap[pIdStr];
      if (socketId) {
        req.io.to(socketId).emit('newMessage', populatedMessage);
      }
    });

    res.json(populatedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
router.delete('/messages/:id', checkAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }

    message.deleted = true;
    message.content = "This message was deleted";
    message.type = "text";
    message.linkPreview = null;
    await message.save();

    // Emit socket event to update clients
    const conversation = await Conversation.findById(message.conversationId);
    conversation.participants.forEach(participantId => {
      const socketId = req.userSocketMap[participantId.toString()];
      if (socketId) {
        req.io.to(socketId).emit('messageDeleted', { messageId: message._id, conversationId: message.conversationId });
      }
    });

    res.json({ success: true, messageId: message._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Utils ---
// Link Preview Scraper
router.post('/utils/link-preview', checkAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    // Very basic regex scraping (a real app would use a library like 'link-preview-js')
    const response = await axios.get(url);
    const html = response.data;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    res.json({
      title: titleMatch ? titleMatch[1] : url,
      description: descMatch ? descMatch[1] : '',
      image: imageMatch ? imageMatch[1] : null,
      url
    });
  } catch (err) {
    // Silently fail preview on error
    res.json(null);
  }
});

module.exports = router;
