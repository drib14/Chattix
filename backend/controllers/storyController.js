import Story from '../models/Story.js';
import User from '../models/User.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const includesId = (list, id) => list.some((entry) => entry.toString() === id.toString());

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
  try {
    const { caption, audience } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required for a story' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ message: 'Cloudinary is not configured' });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const mediaType = isVideo ? 'video' : 'image';
    const resourceType = 'auto';

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chattix/stories',
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const story = await Story.create({
      user: req.user._id,
      mediaUrl: result.secure_url,
      mediaType,
      caption: caption || '',
      audience: audience || 'friends',
      expiresAt,
      viewedBy: [req.user._id], // User viewed their own story implicitly
    });

    await story.populate('user', 'fullName username avatar');

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
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!includesId(story.viewedBy, req.user._id)) {
      story.viewedBy.push(req.user._id);
      await story.save();
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
    const story = await Story.findById(req.params.storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await story.deleteOne();
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: error.message });
  }
};
