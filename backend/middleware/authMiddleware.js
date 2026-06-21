import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ message: 'Not authorized, no Clerk session' });
    }

    const clerkId = req.auth.userId;
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Sync from Clerk Backend API
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Chattix User';
      const avatar = clerkUser.imageUrl || `https://ui-avatars.com/api/?background=6366F1&color=fff&bold=true&name=${encodeURIComponent(fullName)}`;
      const username = clerkUser.username || `user_${clerkId.substring(0, 8)}`;

      user = await User.create({
        clerkId,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email.toLowerCase(),
        fullName,
        avatar,
        isOnline: true,
      });
      console.log(`Clerk user ${username} synced to local MongoDB.`);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Clerk Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, Clerk token invalid' });
  }
};
