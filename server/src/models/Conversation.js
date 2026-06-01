import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '', // Used for group chats
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: '', // Group picture url
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Users with admin roles in a group
      },
    ],
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupPermissions: {
      announcementsOnly: { type: Boolean, default: false },
      allowMemberInvites: { type: Boolean, default: true },
      allowMemberPins: { type: Boolean, default: true },
    },
    inviteToken: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
