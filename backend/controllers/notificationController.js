import Notification from '../models/Notification.js';

export const createNotification = async ({ recipient, sender, type, title, body, data = {} }) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    body,
    data,
  });
  await notification.populate('sender', 'fullName username avatar');
  return notification;
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(Array.isArray(notifications) ? notifications : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
