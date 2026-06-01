import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/mailer.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET || 'superultramegasecret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      verificationCode,
    });

    // Send email (async, doesn't block response)
    const emailSent = await sendVerificationEmail(user.email, verificationCode);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification code sent.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
      // Bypass code provided directly to client for local testing speed
      bypassCode: verificationCode,
      emailSent,
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Server error.' });
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify
// @access  Public
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = '';
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        statusText: user.statusText,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('[Verify Email Error]:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Server error.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { loginIdentifier, password } = req.body; // username or email

  try {
    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find by username OR email
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { username: loginIdentifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Re-generate and send verification code if user registers but never verified
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationCode;
      await user.save();
      await sendVerificationEmail(user.email, verificationCode);

      return res.status(403).json({
        success: false,
        isNotVerified: true,
        message: 'Account not verified. A verification code has been resent to your email.',
        email: user.email,
        bypassCode: verificationCode,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        statusText: user.statusText,
        isVerified: user.isVerified,
        contacts: user.contacts,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ success: false, message: 'Login failed. Server error.' });
  }
};

// @desc    Request Password Reset Code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account with that email exists' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    await user.save();

    await sendResetPasswordEmail(user.email, resetCode);

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email.',
      bypassCode: resetCode,
    });
  } catch (error) {
    console.error('[Forgot Password Error]:', error);
    res.status(500).json({ success: false, message: 'Action failed. Server error.' });
  }
};

// @desc    Reset Password with Code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    user.password = newPassword; // Pre-save hook will hash this automatically!
    user.resetPasswordCode = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.',
    });
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ success: false, message: 'Password reset failed. Server error.' });
  }
};

// @desc    Get Authenticated User Info
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user session.' });
  }
};
