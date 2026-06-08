import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
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
