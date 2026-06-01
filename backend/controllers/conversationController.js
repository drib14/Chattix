import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

export const accessConversation = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ message: 'UserId param not sent with request' });
    return;
  }

  let isConversation = await Conversation.find({
    isGroup: false,
    $and: [
      { participants: { $elemMatch: { $eq: req.user?._id } } },
      { participants: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('participants', '-password')
    .populate('lastMessage');

  isConversation = await User.populate(isConversation, {
    path: 'lastMessage.sender',
    select: 'username profilePic email',
  });

  if (isConversation.length > 0) {
    res.send(isConversation[0]);
  } else {
    var conversationData = {
      groupName: 'sender',
      isGroup: false,
      participants: [req.user?._id, userId],
    };

    try {
      const createdConversation = await Conversation.create(conversationData);
      const FullConversation = await Conversation.findOne({ _id: createdConversation._id }).populate(
        'participants',
        '-password'
      );
      res.status(200).json(FullConversation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

export const fetchConversations = async (req, res) => {
  try {
    Conversation.find({ participants: { $elemMatch: { $eq: req.user?._id } } })
      .populate('participants', '-password')
      .populate('admin', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'lastMessage.sender',
          select: 'username profilePic email',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createGroupConversation = async (req, res) => {
  if (!req.body.users || !req.body.name) {
     res.status(400).send({ message: 'Please Fill all the feilds' });
     return;
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    res
      .status(400)
      .send('More than 2 users are required to form a group chat');
      return;
  }

  users.push(req.user);

  try {
    const groupConversation = await Conversation.create({
      groupName: req.body.name,
      participants: users,
      isGroup: true,
      admin: req.user,
    });

    const fullGroupConversation = await Conversation.findOne({ _id: groupConversation._id })
      .populate('participants', '-password')
      .populate('admin', '-password');

    res.status(200).json(fullGroupConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateConversationTheme = async (req, res) => {
  const { conversationId, theme } = req.body;

  if (!conversationId || !theme) {
     res.status(400).json({ message: 'ConversationId and theme are required' });
     return;
  }

  try {
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { theme },
      { new: true }
    )
      .populate('participants', '-password')
      .populate('admin', '-password');

    res.status(200).json(updatedConversation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
