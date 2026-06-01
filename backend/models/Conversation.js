import mongoose, { Schema } from 'mongoose';

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String, default: '' },
    admin: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    theme: { type: String, default: 'default' },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
