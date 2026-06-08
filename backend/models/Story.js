import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mediaUrl: {
    type: String,
    // not required if it's textMode
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'text'],
    default: 'image',
  },
  textMode: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: 'bg-gradient-to-tr from-blue-500 to-purple-600',
  },
  fontFamily: {
    type: String,
    default: 'font-sans',
  },
  fontColor: {
    type: String,
    default: 'text-white',
  },
  caption: {
    type: String,
    trim: true,
    default: '',
  },
  audience: {
    type: String,
    enum: ['public', 'friends', 'only_me'],
    default: 'friends',
  },
  viewedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now },
  }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
    reactedAt: { type: Date, default: Date.now },
  }],
  overlays: {
    type: Array,
    default: [],
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// TTL index to automatically delete expired stories after 24 hours
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Story', storySchema);
