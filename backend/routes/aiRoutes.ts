import express from 'express';
import { generateAIResponse } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, generateAIResponse);

export default router;