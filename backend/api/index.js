require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { clerkMiddleware } = require('@clerk/express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { checkAuth } = require('../middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(clerkMiddleware());

app.use(cors());
app.use(express.json());

// --- Socket.io Setup ---
const userSocketMap = {}; // Maps DB userId to socketId

io.on('connection', async (socket) => {
  // Query parameter will be the MongoDB User _id, passed from the frontend
  const dbUserId = socket.handshake.query.userId;
  if (dbUserId && mongoose.Types.ObjectId.isValid(dbUserId)) {
    userSocketMap[dbUserId] = socket.id;
    // Update user online status in DB
    try {
      await User.findByIdAndUpdate(dbUserId, { isOnline: true }).exec();
      io.emit('userOnlineStatus', { userId: dbUserId, isOnline: true });
    } catch(err) {
      console.error("Socket user update error", err);
    }
  }

  socket.on('typing', ({ conversationId, senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { conversationId, senderId });
    }
  });

  socket.on('stopTyping', ({ conversationId, senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('stopTyping', { conversationId, senderId });
    }
  });

  socket.on('disconnect', async () => {
    if (dbUserId && mongoose.Types.ObjectId.isValid(dbUserId)) {
      delete userSocketMap[dbUserId];
      try {
        await User.findByIdAndUpdate(dbUserId, { isOnline: false, lastSeen: Date.now() }).exec();
        io.emit('userOnlineStatus', { userId: dbUserId, isOnline: false, lastSeen: Date.now() });
      } catch(err) {
        console.error("Socket user disconnect error", err);
      }
    }
  });
});

// Pass io to req object for use in routes
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

const chatRoutes = require('../routes/chat');
app.use('/api', chatRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Rate Limiting for Auth Endpoints (relaxed for dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth Sync Endpoint
app.post('/api/auth/sync', authLimiter, checkAuth, async (req, res) => {
  try {
    const { email, firstName, lastName, profileImageUrl, username } = req.body;

    // Use the verified clerk user ID from the token
    const clerkId = req.auth.userId;

    if (!clerkId || !email) {
      return res.status(400).json({ message: 'Valid token and email are required' });
    }

    // Atomic update or insert (upsert) to completely prevent race conditions
    // from React StrictMode causing duplicate user documents
    const updateData = {
      email,
      firstName,
      lastName,
      profileImageUrl
    };

    if (username) updateData.username = username;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateData, $setOnInsert: { username: username || 'chattix_user' } },
      { new: true, upsert: true }
    );

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
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
