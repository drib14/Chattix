import { Server } from 'socket.io';
import User from './models/User.js';

// Keep track of active socket connections by userId
const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all client connections
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Register user session
    socket.on('setup', async (userData) => {
      if (!userData || (!userData.id && !userData._id)) return;
      
      const userId = userData.id || userData._id;
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      
      console.log(`[Socket] User registered: ${userId}`);

      try {
        // Mark user online
        await User.findByIdAndUpdate(userId, { isOnline: true });
        
        // Broadcast status update
        socket.broadcast.emit('user_status_change', {
          userId,
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error('[Socket Setup Error]:', error);
      }

      // Return currently online users list to setup requester
      socket.emit('connected_users', Array.from(onlineUsers.keys()));
    });

    // Join chat room
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket] Socket ${socket.id} joined room: ${room}`);
    });

    // Leave chat room
    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`[Socket] Socket ${socket.id} left room: ${room}`);
    });

    // Typing indicators
    socket.on('typing', (data) => {
      // data: { conversationId, username }
      if (!data.conversationId) return;
      socket.to(data.conversationId).emit('typing_received', data);
    });

    socket.on('stop_typing', (data) => {
      // data: { conversationId }
      if (!data.conversationId) return;
      socket.to(data.conversationId).emit('stop_typing_received', data);
    });

    // Message read receipts
    socket.on('message_read', async (data) => {
      // data: { messageId, conversationId, userId }
      if (!data.messageId || !data.conversationId) return;
      
      try {
        socket.to(data.conversationId).emit('message_read_received', data);
      } catch (error) {
        console.error('[Socket Message Read Error]:', error);
      }
    });

    // Handle typing reaction broadcast
    socket.on('reaction_add', (data) => {
      // data: { messageId, conversationId, reaction: { user: { id, username }, emoji } }
      if (!data.conversationId) return;
      socket.to(data.conversationId).emit('reaction_received', data);
    });

    // Clean up session on disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] Socket disconnected: ${socket.id}`);
      
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        try {
          const lastSeen = new Date();
          // Update User presence to offline
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen,
          });

          // Broadcast status update
          io.emit('user_status_change', {
            userId: disconnectedUserId,
            isOnline: false,
            lastSeen,
          });
          
          console.log(`[Socket] User offline: ${disconnectedUserId}`);
        } catch (error) {
          console.error('[Socket Disconnect Mongoose Error]:', error);
        }
      }
    });
  });

  return io;
};

export { onlineUsers };
