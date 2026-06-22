import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createEvent,
  getEvents,
  updateEventAttendance,
  deleteEvent,
} from '../controllers/eventController.js';

const router = express.Router();

router.post('/', protect, createEvent);
router.get('/:chatId', protect, getEvents);
router.put('/:eventId/attendance', protect, updateEventAttendance);
router.delete('/:eventId', protect, deleteEvent);

export default router;
