import express from 'express';
import {
  createStory,
  getFeedStories,
  markStoryViewed,
  deleteStory
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), createStory);
router.get('/', getFeedStories);
router.put('/:storyId/view', markStoryViewed);
router.delete('/:storyId', deleteStory);

export default router;
