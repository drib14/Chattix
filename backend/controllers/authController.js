import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

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
}

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
  })
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
}
