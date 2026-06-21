import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Synchronize and return user profile information
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
