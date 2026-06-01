import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  image?: string;
  gifUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  paymentIntentId?: string;
  isAiGenerated?: boolean;
  readBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
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
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>('Message', messageSchema);