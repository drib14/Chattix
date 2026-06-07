import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.messageType !== 'system'; },
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  },
  text: {
    type: String,
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'gif', 'system'],
    default: 'text',
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'pdf', 'gif'],
    },
    filename: String,
    duration: Number,
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emoji: String,
  }],
  delivered: {
    type: Boolean,
    default: false,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  seenBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    seenAt: {
      type: Date,
      default: Date.now,
    },
  }],
  pinned: {
    type: Boolean,
    default: false,
  },
  starredBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: Date,
  forwarded: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  mentions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
  }],
  poll: {
    type: new mongoose.Schema({
      question: String,
      options: [{
        text: String,
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      }],
      allowMultipleVotes: { type: Boolean, default: false },
      totalVotes: { type: Number, default: 0 },
    }, { _id: false }),
    default: undefined,
  },
}, {
  timestamps: true,
});

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ group: 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model('Message', messageSchema);
