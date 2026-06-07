import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
  },
  groupAvatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/group-default.png',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
    default: () => crypto.randomBytes(8).toString('hex'),
  },
  inviteCodeEnabled: {
    type: Boolean,
    default: true,
  },
  groupRules: {
    type: String,
    maxlength: [1000, 'Group rules cannot exceed 1000 characters'],
    default: '',
  },
  announcementMode: {
    type: Boolean,
    default: false,
  },
  pinnedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  mediaCount: {
    type: Number,
    default: 0,
  },
  fileCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Ensure inviteCode is always present and unique
groupSchema.pre('save', async function (next) {
  if (!this.inviteCode) {
    let code;
    let exists = true;
    while (exists) {
      code = crypto.randomBytes(8).toString('hex');
      exists = await mongoose.model('Group').findOne({ inviteCode: code });
    }
    this.inviteCode = code;
  }
  next();
});

export default mongoose.model('Group', groupSchema);
