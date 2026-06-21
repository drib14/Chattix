import Event from '../models/Event.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// Create event
export const createEvent = async (req, res) => {
  try {
    const { chatId, title, description, startDate, endDate, location, color } = req.body;

    if (!chatId || !title || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create system message for event
    const eventMessage = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: `📅 ${title}`,
      attachments: [],
    });

    const event = await Event.create({
      chat: chatId,
      creator: req.user._id,
      title,
      description,
      startDate,
      endDate,
      location,
      color,
      messageId: eventMessage._id,
      attendees: [{ user: req.user._id, status: 'going' }],
    });

    await event.populate('creator', 'fullName username avatar');
    await event.populate('attendees.user', 'fullName username avatar');

    // Emit socket event
    if (req.io) {
      req.io.to(chatId).emit('event_created', event);
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get events for chat
export const getEvents = async (req, res) => {
  try {
    const { chatId } = req.params;

    const events = await Event.find({ chat: chatId })
      .populate('creator', 'fullName username avatar')
      .populate('attendees.user', 'fullName username avatar')
      .sort({ startDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update event attendance
export const updateEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!['going', 'not-going', 'maybe'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find or create attendee entry
    let attendee = event.attendees.find(a => a.user.toString() === req.user._id.toString());
    if (!attendee) {
      event.attendees.push({ user: req.user._id, status });
    } else {
      attendee.status = status;
    }

    await event.save();
    await event.populate('attendees.user', 'fullName username avatar');

    // Emit socket event
    if (req.io) {
      req.io.to(event.chat).emit('event_attendance_updated', { eventId, status, userId: req.user._id });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Delete event message
    if (event.messageId) {
      await Message.findByIdAndDelete(event.messageId);
    }

    await Event.findByIdAndDelete(eventId);

    // Emit socket event
    if (req.io) {
      req.io.to(event.chat).emit('event_deleted', { eventId });
    }

    res.status(200).json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
