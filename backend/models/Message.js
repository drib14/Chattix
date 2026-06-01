import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: { type: String },
    gifUrl: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    paymentIntentId: { type: String },
    isAiGenerated: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    callLog: {
      callType: { type: String }, // 'voice' | 'video'
      status: { type: String }, // 'missed' | 'declined' | 'ended'
      duration: { type: Number }, // in seconds
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
export default Message;
