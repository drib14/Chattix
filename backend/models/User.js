import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline',
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    select: false,
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  coverImage: {
    type: String,
    default: '',
  },
  statusMessage: {
    type: String,
    maxlength: [139, 'Status cannot exceed 139 characters'],
    default: '',
  },
  pinnedChats: [{
    chatId: { type: mongoose.Schema.Types.ObjectId },
    chatType: { type: String, enum: ['user', 'group'], default: 'user' },
    pinnedAt: { type: Date, default: Date.now },
  }],
  archivedChats: [{
    chatId: mongoose.Schema.Types.ObjectId,
    chatType: { type: String, enum: ['user', 'group'], default: 'user' },
  }],
  mutedChats: [{
    chatId: mongoose.Schema.Types.ObjectId,
    chatType: { type: String, enum: ['user', 'group'], default: 'user' },
    mutedUntil: Date,
  }],
  chatWallpapers: [{
    chatId: mongoose.Schema.Types.ObjectId,
    chatType: { type: String, enum: ['user', 'group'], default: 'user' },
    wallpaper: {
      type: String,
      enum: ['default', 'blue', 'dark', 'gradient', 'custom'],
      default: 'default',
    },
    customUrl: String,
  }],
  unreadCounts: [{
    chatId: mongoose.Schema.Types.ObjectId,
    chatType: { type: String, enum: ['user', 'group'], default: 'user' },
    count: { type: Number, default: 0 },
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  // Set expiry time (default 5 minutes)
  const expiryMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES || 5);
  this.otpExpiry = Date.now() + expiryMinutes * 60 * 1000;
  
  console.log(`🔐 OTP Generated: ${otp} | Expires in ${expiryMinutes} minutes`);
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otp) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }
  
  if (this.otpExpiry < Date.now()) {
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  if (this.otp !== enteredOTP) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  return { valid: true, message: 'OTP verified successfully.' };
};

// Clear OTP after verification
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
  this.otpExpiry = undefined;
};

export default mongoose.model('User', userSchema);
