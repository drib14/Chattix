import rateLimit from 'express-rate-limit';

// Auth routes: strict limits to prevent brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Read-only (GET) routes: generous limits — these are non-destructive
// and frequently polled/loaded in parallel on page load
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Notification polling: even more generous since these fire automatically
export const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { message: 'Too many notification requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Message sending: moderate limits
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { message: 'You are sending messages too fast. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File/image uploads: stricter limits
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { message: 'Too many uploads. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Story creation: moderate limits
export const storyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  message: { message: 'Too many story actions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API routes (write operations): increased ceiling
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Friend requests: prevent spam
export const friendRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { message: 'Too many friend requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
