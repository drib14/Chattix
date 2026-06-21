import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        type: { type: String, enum: ['image', 'video', 'audio', 'file'], required: true },
        size: { type: Number },
      },
    ],
    linkPreview: {
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    seenBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
