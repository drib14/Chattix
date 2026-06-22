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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
const authRoutes = require('../routes/auth');
app.use('/api', chatRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


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
