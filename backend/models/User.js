const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    sparse: true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    default: 'chattix_user',
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  profileImageUrl: {
    type: String,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
