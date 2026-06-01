import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import { initSocket } from './src/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Express Middleware
app.use(cors({
  origin: '*', // Allow connections from all hosts
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Sockets
const io = initSocket(server);
app.set('socketio', io); // Expose Socket.io instance globally inside Express req handlers

// API Root check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Express Global Error Handler]:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred',
  });
});

// Database Connection & Start Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('[Error] MONGO_URI is missing from environment variables (.env)');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected to database successfully');
    server.listen(PORT, () => {
      console.log(`[Server] Chattix server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[MongoDB] Connection failed:', error.message);
    process.exit(1);
  });
