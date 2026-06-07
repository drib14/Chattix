require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_connected', async (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { lastActive: Date.now() });
    io.emit('update_active_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', async (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', data.message);
    }
    
    // Update sender's activity
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { lastActive: Date.now() });
      io.emit('update_active_users', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing', { senderId: socket.userId });
    }
  });

  socket.on('stop_typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('stop_typing', { senderId: socket.userId });
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { lastActive: Date.now() });
      io.emit('update_active_users', Array.from(onlineUsers.keys()));
    }
  });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

