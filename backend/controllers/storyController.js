import Story from '../models/Story.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const includesId = (list, id) => list.some((entry) => entry.toString() === id.toString());

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
  try {
    const { caption, audience, textMode, backgroundColor, fontFamily, fontColor, overlays } = req.body;
    const isTextMode = textMode === 'true' || textMode === true;
    const io = req.app.get('io');
    
    let parsedOverlays = [];
    if (overlays) {
      try {
        parsedOverlays = typeof overlays === 'string' ? JSON.parse(overlays) : overlays;
      } catch(e) {
        console.error('Failed to parse overlays:', e);
      }
    }
    
    let mediaUrl = '';
    let mediaType = 'text';

    if (!isTextMode) {
      if (!req.file) {
        return res.status(400).json({ message: 'Media file is required for a media story' });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: 'Cloudinary is not configured' });
      }

      const isVideo = req.file.mimetype.startsWith('video');
      mediaType = isVideo ? 'video' : 'image';

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'chattix/stories',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      
      mediaUrl = result.secure_url;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const story = await Story.create({
      user: req.user._id,
      mediaUrl,
      mediaType,
      textMode: isTextMode,
      backgroundColor: backgroundColor || undefined,
      fontFamily: fontFamily || undefined,
      fontColor: fontColor || undefined,
      overlays: parsedOverlays,
      caption: caption || '',
      audience: audience || 'friends',
      expiresAt,
      viewedBy: [{ user: req.user._id, viewedAt: new Date() }], // User viewed their own story implicitly
    });

    await story.populate('user', 'fullName username avatar');

    // Emit real-time event to all clients
    if (io) {
      io.emit('new_story', story);
    }

    // Notify friends of story creation
    const currentUser = await User.findById(req.user._id);
    if (currentUser && currentUser.friends && currentUser.friends.length > 0) {
      const notifications = currentUser.friends.map(friendId => ({
        recipient: friendId,
        sender: req.user._id,
        type: 'story_creation',
        title: 'New Story',
        body: `${currentUser.fullName || currentUser.username} added to their story`,
        data: { storyId: story._id }
      }));
      await Notification.insertMany(notifications);
      if (io) {
        currentUser.friends.forEach(friendId => {
          io.to(friendId.toString()).emit('new_notification');
        });
      }
    }


    // Handle Story Mentions
    if (parsedOverlays && parsedOverlays.length > 0) {
      const tags = parsedOverlays.filter(o => o.type === 'tag' && o.userId);
      if (tags.length > 0) {
        // We need to import Message
        const { default: Message } = await import('../models/Message.js');
        
        for (const tag of tags) {
          // Don't send notification to self
          if (tag.userId.toString() !== req.user._id.toString()) {
            const mentionMessage = await Message.create({
              sender: req.user._id,
              receiver: tag.userId,
              text: 'Mentioned you in a story',
              systemMessage: true,
              systemMessageType: 'story_mention',
              storyId: story._id
            });
            
            await Notification.create({
              recipient: tag.userId,
              sender: req.user._id,
              type: 'story_tagged',
              title: 'Story Mention',
              body: `${currentUser ? (currentUser.fullName || currentUser.username) : 'Someone'} mentioned you in their story`,
              data: { storyId: story._id }
            });
            if (io) io.to(tag.userId.toString()).emit('new_notification');

            
            await mentionMessage.populate('sender', 'fullName username avatar');
            await mentionMessage.populate('receiver', 'fullName username avatar');
            
            if (io) {
              io.to(tag.userId.toString()).emit('receive_message', mentionMessage);
            }
          }
        }
      }
    }

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feed stories (Active stories for the user)
// @route   GET /api/stories
// @access  Private
export const getFeedStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // We want to fetch stories that are not expired and meet audience criteria:
    // 1. My own stories
    // 2. Public stories
    // 3. Friends' stories (if audience is 'friends')
    
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      $or: [
        { user: req.user._id },
        { audience: 'public' },
        { 
          user: { $in: currentUser.friends },
          audience: 'friends'
        }
      ]
    })
    .populate('user', 'fullName username avatar status lastSeen')
    .populate('viewedBy.user', 'fullName username avatar')
    .populate('reactions.user', 'fullName username avatar')
    .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark story as viewed
// @route   PUT /api/stories/:storyId/view
// @access  Private
export const markStoryViewed = async (req, res) => {
  try {
    const io = req.app.get('io');
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const hasViewed = story.viewedBy.some(v => v.user?.toString() === req.user._id.toString());
    
    if (!hasViewed) {
      story.viewedBy.push({ user: req.user._id, viewedAt: new Date() });
      await story.save();
      
      // Emit to the story owner that their story was viewed
      if (io && story.user.toString() !== req.user._id.toString()) {
        io.emit('story_viewed', { storyId: story._id, viewerId: req.user._id, ownerId: story.user });
      }
    }

    res.json({ success: true, storyId: story._id });
  } catch (error) {
    console.error('Mark viewed error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:storyId
// @access  Private
export const deleteStory = async (req, res) => {
  try {
    const io = req.app.get('io');
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await story.deleteOne();
    
    if (io) {
      io.emit('story_deleted', { storyId: req.params.storyId });
    }
    
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    React to a story
// @route   POST /api/stories/:storyId/react
// @access  Private
export const reactToStory = async (req, res) => {
  try {
    const { emoji } = req.body;
    const io = req.app.get('io');
    const story = await Story.findById(req.params.storyId);
    
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.reactions.push({ user: req.user._id, emoji, reactedAt: new Date() });
    await story.save();

    if (io && story.user.toString() !== req.user._id.toString()) {
      io.emit('story_reacted', { storyId: story._id, reactorId: req.user._id, ownerId: story.user, emoji });
    }
    
    if (story.user.toString() !== req.user._id.toString()) {
      const currentUser = await User.findById(req.user._id);
      await Notification.create({
        recipient: story.user,
        sender: req.user._id,
        type: 'story_interaction',
        title: 'Story Reaction',
        body: `${currentUser ? (currentUser.fullName || currentUser.username) : 'Someone'} reacted to your story`,
        data: { storyId: story._id, emoji }
      });
      if (io) io.to(story.user.toString()).emit('new_notification');
    }


    await story.populate('reactions.user', 'fullName username avatar');

    res.json({ success: true, reactions: story.reactions });
  } catch (error) {
    console.error('React to story error:', error);
    res.status(500).json({ message: error.message });
  }
};
