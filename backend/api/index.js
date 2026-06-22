require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { clerkMiddleware, requireAuth } = require('@clerk/express');

const app = express();

app.use(clerkMiddleware());

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Rate Limiting for Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per minute)
  message: { message: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth Sync Endpoint
app.post('/api/auth/sync', authLimiter, requireAuth(), async (req, res) => {
  try {
    const { email, firstName, lastName, profileImageUrl } = req.body;

    // Use the verified clerk user ID from the token
    const clerkId = req.auth.userId;

    if (!clerkId || !email) {
      return res.status(400).json({ message: 'Valid token and email are required' });
    }

    // Check if user exists, if not, create them
    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({
        clerkId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });
      await user.save();
      return res.status(201).json({ message: 'User created successfully', user });
    }

    // Update user info if it has changed
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.profileImageUrl = profileImageUrl;
    await user.save();

    return res.status(200).json({ message: 'User synced successfully', user });

  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Chattix API is running...');
});

// Ensure the server handles Vercel serverless correctly by exporting the app
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
