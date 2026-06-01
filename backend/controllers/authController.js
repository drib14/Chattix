import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const setTokenCookie = (res, token) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const sendResetEmail = async (email, otp) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log(`\n========================================`);
      console.log(`[PASSWORD RESET OTP] For ${email}: ${otp}`);
      console.log(`========================================\n`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Chattix Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Chattix Account Password Reset Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #0b0d12; color: #fff;">
          <h2 style="color: #aa3bff; text-align: center;">Chattix Account Recovery</h2>
          <p style="color: #ccc;">Hello,</p>
          <p style="color: #ccc;">We received a request to reset your account password. Use the verification code below to proceed with setting a new password. This code will expire in 10 minutes.</p>
          <div style="background: #171821; border: 1px solid #2e303a; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #aa3bff; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #ccc;">If you did not request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #2e303a; margin: 20px 0;" />
          <p style="font-size: 11px; color: #666; text-align: center;">© 2026 Chattix. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    console.log(`\n========================================`);
    console.log(`[FALLBACK RESET OTP] For ${email}: ${otp}`);
    console.log(`========================================\n`);
    return false;
  }
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
       res.status(400).json({ message: 'User already exists' });
       return;
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      setTokenCookie(res, accessToken);
      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        theme: user.theme,
        token: accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      setTokenCookie(res, accessToken);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        theme: user.theme,
        token: accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
         res.status(401).json({ message: 'Not authorized, no refresh token' });
         return;
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if(!user) {
             res.status(401).json({ message: 'Not authorized, invalid refresh token' });
             return;
        }

        const newAccessToken = generateAccessToken(user._id);
        setTokenCookie(res, newAccessToken);

        res.status(200).json({ message: 'Token refreshed' });

    } catch (error) {
        res.status(401).json({ message: 'Not authorized, refresh token failed' });
    }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'No account registered with this email address' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendResetEmail(email, otp);

    res.json({ message: 'Verification code sent to your email address' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired verification code' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
