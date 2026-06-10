import express from 'express';
import {
  createStory,
  getFeedStories,
  markStoryViewed,
  deleteStory,
  reactToStory
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { storyLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', uploadLimiter, upload.single('media'), createStory);
router.get('/', generalLimiter, getFeedStories);
router.put('/:storyId/view', generalLimiter, markStoryViewed);
router.delete('/:storyId', storyLimiter, deleteStory);
router.post('/:storyId/react', storyLimiter, reactToStory);

export default router;
