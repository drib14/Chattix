const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.userId;

    if (!recipientId || !text) {
      return res.status(400).json({ message: 'Recipient ID and text are required' });
    }

    const newMessage = new Message({
      senderId,
      recipientId,
      text
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const senderId = req.userId;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

module.exports = {
  sendMessage,
  getMessages
};
