import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: '',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    nicknames: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        nickname: { type: String },
      },
    ],
    theme: {
      type: String,
      default: 'default',
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
