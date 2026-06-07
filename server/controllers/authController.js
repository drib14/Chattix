const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // Send welcome email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Chattix Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Chattix!',
        html: `
          <div style="font-family: 'Inter', sans-serif; text-align: center; color: #333;">
            <h1 style="color: #4A90E2;">Welcome to Chattix, ${firstName}!</h1>
            <p>We are thrilled to have you on board. Start connecting with your friends and colleagues today.</p>
            <p>Your username is: <strong>${username}</strong></p>
            <br/>
            <p>Best regards,</p>
            <p>The Chattix Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Failed to send welcome email", emailError);
      // We don't fail the registration if email fails
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Error in registration", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }] 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.ACCESS_TOKEN_SECRET || 'secret', 
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } 
    });
  } catch (error) {
    console.error("Error in login", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate password reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Send reset password email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"Chattix Team" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your Chattix Password',
        html: `
          <div style="font-family: 'Inter', sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #3b82f6;">Password Reset Request</h2>
            <p>Hello, ${user.firstName}. We received a request to reset your password for your Chattix account.</p>
            <p>Please click the button below to reset your password. This link is valid for 15 minutes.</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 0.875rem;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; font-size: 0.875rem; word-break: break-all;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 0.75rem;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Failed to send reset email", emailError);
      return res.status(500).json({ message: 'Error sending password reset email' });
    }

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error("Error in forgot password", error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'secret');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error("Error in reset password", error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
