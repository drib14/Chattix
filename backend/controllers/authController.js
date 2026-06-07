import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { validatePassword, validateUsername } from '../utils/validators.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { fullName, username, email, mobileNumber, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !username || !email || !mobileNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Validate username
    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ message: usernameError });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }, { mobileNumber }],
    });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (userExists.username === username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      if (userExists.mobileNumber === mobileNumber) {
        return res.status(400).json({ message: 'Mobile number already registered' });
      }
    }

    // Create user
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true`;

    const user = await User.create({
      fullName,
      username,
      email,
      mobileNumber,
      password,
      avatar: avatarUrl,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Generated OTP for user:', user.email, '| OTP:', otp);
    }

    // Send OTP email
    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Email Verification - Chattix',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Chattix! 🎉</h1>
              </div>
              <div class="content">
                <h2>Email Verification</h2>
                <p>Thank you for registering! Please use the OTP below to verify your email address:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>⏰ This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.</strong></p>
                <p>If you didn't request this verification, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Chattix. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log('✅ OTP email sent successfully to:', user.email);
      console.log('📬 Email Message ID:', emailResult.messageId);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again or check your email address.',
        error: emailError.message 
      });
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for the OTP verification code.',
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log('🔍 Verifying OTP for user:', userId);

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    // Verify OTP using the model method
    const verification = user.verifyOTP(otp);
    
    if (!verification.valid) {
      console.log('❌ OTP verification failed:', verification.message);
      return res.status(400).json({ message: verification.message });
    }

    console.log('✅ OTP verified successfully for user:', user.email);

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully! Welcome to Chattix! 🎉',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        themePreference: user.themePreference,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or mobile

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide login credentials' });
    }

    // Find user by email or mobile number
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update status to online
    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        themePreference: user.themePreference,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Generated password reset OTP for:', user.email, '| OTP:', otp);
    }

    // Send OTP email
    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - Chattix',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 5px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔒 Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>⏰ This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.</strong></p>
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Chattix. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log('✅ Password reset OTP email sent successfully to:', user.email);
      console.log('📬 Email Message ID:', emailResult.messageId);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message);
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again.',
        error: emailError.message 
      });
    }

    res.json({
      message: 'Password reset OTP sent to your email. Please check your inbox.',
      userId: user._id,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword, confirmPassword } = req.body;

    console.log('🔍 Resetting password for user:', userId);

    if (!userId || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findById(userId).select('+otp +otpExpiry +password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const verification = user.verifyOTP(otp);
    
    if (!verification.valid) {
      console.log('❌ OTP verification failed:', verification.message);
      return res.status(400).json({ message: verification.message });
    }

    console.log('✅ OTP verified, updating password for:', user.email);

    // Update password and clear OTP
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    res.json({ message: 'Password reset successful! You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Resending OTP for user:', user.email, '| OTP:', otp);
    }

    // Send OTP email
    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Email Verification - Chattix (Resent)',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔄 New Verification Code</h1>
              </div>
              <div class="content">
                <h2>Email Verification</h2>
                <p>Here's your new OTP for email verification:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>⏰ This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 5} minutes.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Chattix. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log('✅ OTP resent successfully to:', user.email);
      console.log('📬 Email Message ID:', emailResult.messageId);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError.message);
      return res.status(500).json({ 
        message: 'Failed to resend OTP email. Please try again.',
        error: emailError.message 
      });
    }

    res.json({ 
      message: 'New OTP sent successfully! Please check your email.',
      expiresIn: `${process.env.OTP_EXPIRE_MINUTES || 5} minutes`
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: Date.now(),
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: error.message });
  }
};
