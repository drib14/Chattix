import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';

export const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'username profilePic email')
      .populate('conversationId');
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const { content, conversationId, image, gifUrl, location, paymentIntentId, isAiGenerated } = req.body;

  if (!conversationId) {
    console.log('Invalid data passed into request');
     res.sendStatus(400);
     return;
  }

  var newMessage = {
    sender: req.user?._id,
    text: content,
    conversationId: conversationId,
    image,
    gifUrl,
    location,
    paymentIntentId,
    isAiGenerated,
  };

  try {
    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'username profilePic');
    message = await message.populate('conversationId');
    message = await User.populate(message, {
      path: 'conversationId.participants',
      select: 'username profilePic email',
    });

    await Conversation.findByIdAndUpdate(req.body.conversationId, {
      lastMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
