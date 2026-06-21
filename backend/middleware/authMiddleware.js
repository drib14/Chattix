import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authState = req.auth();
    if (!authState || !authState.userId) {
      return res.status(401).json({ message: 'Not authorized, no Clerk session' });
    }

    const clerkId = authState.userId;
    let user = await User.findOne({ clerkId });

    if (!user) {
      try {
        // Sync from Clerk Backend API
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Chattix User';
        const avatar = clerkUser.imageUrl || `https://ui-avatars.com/api/?background=6366F1&color=fff&bold=true&name=${encodeURIComponent(fullName)}`;
        const username = clerkUser.username || `user_${clerkId.replace('user_', '')}`;

        user = await User.create({
          clerkId,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          email: email.toLowerCase(),
          fullName,
          avatar,
          isOnline: true,
        });
        console.log(`Clerk user ${username} synced to local MongoDB.`);
      } catch (createError) {
        // Handle database write race conditions from concurrent requests
        if (createError.code === 11000 || createError.name === 'MongoServerError') {
          user = await User.findOne({ clerkId });
          if (!user) {
            throw createError;
          }
          console.log(`Clerk user recovered from concurrent sync race condition.`);
        } else {
          throw createError;
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Clerk Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, Clerk token invalid' });
  }
};
