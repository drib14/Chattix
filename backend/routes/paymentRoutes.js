import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/create-intent').post(protect, createPaymentIntent);

export default router;
