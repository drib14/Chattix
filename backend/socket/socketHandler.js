import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store online users with socket info
const onlineUsers = new Map(); // userId -> { socketId, username, lastSeen }

export const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Add user to online users
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      lastSeen: new Date(),
    });

    // Join user's personal room
    socket.join(socket.userId);

    // Update user status to online
    User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      isOnline: true,
      lastSeen: Date.now(),
    }).exec();

    // Broadcast online users list with details
    const onlineUsersList = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      lastSeen: data.lastSeen,
    }));
    io.emit('online_users', onlineUsersList);

    // Send online status to the connected user
    socket.emit('user_status_update', {
      userId: socket.userId,
      isOnline: true,
      status: 'online',
    });

    // Handle join room (for groups)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`${socket.username} joined room: ${roomId}`);
    });

    // Handle leave room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.username} left room: ${roomId}`);
    });

    // Handle typing indicator - Private chat
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverData = onlineUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          isTyping,
        });
      }
    });

    // Handle stop typing - Private chat
    socket.on('stop_typing', ({ receiverId }) => {
      const receiverData = onlineUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          isTyping: false,
        });
      }
    });

    // Handle group typing
    socket.on('group_typing', ({ groupId, isTyping }) => {
      socket.to(groupId).emit('user_typing_group', {
        userId: socket.userId,
        username: socket.username,
        groupId,
        isTyping,
      });
    });

    // Handle stop group typing
    socket.on('stop_group_typing', ({ groupId }) => {
      socket.to(groupId).emit('user_typing_group', {
        userId: socket.userId,
        username: socket.username,
        groupId,
        isTyping: false,
      });
    });

    // Handle private message
    socket.on('send_message', async (data) => {
      const { receiverId, message } = data;
      
      // Send to receiver if online
      const receiverData = onlineUsers.get(receiverId);
      if (receiverData) {
        io.to(receiverData.socketId).emit('receive_message', {
          ...message,
          sender: socket.userId,
        });
      }

      // Send delivery confirmation to sender
      socket.emit('message_sent', { messageId: message._id });
    });

    // Handle group message
    socket.on('send_group_message', async (data) => {
      const { groupId, message } = data;
      
      // Broadcast to group members
      socket.to(groupId).emit('receive_group_message', {
        ...message,
        sender: socket.userId,
      });

      socket.emit('message_sent', { messageId: message._id });
    });

    // Handle message delivered
    socket.on('message_delivered', ({ messageId, senderId }) => {
      const senderData = onlineUsers.get(senderId);
      if (senderData) {
        io.to(senderData.socketId).emit('message_status', {
          messageId,
          status: 'delivered',
        });
      }
    });

    // Handle message seen
    socket.on('message_seen', ({ messageId, senderId }) => {
      const senderData = onlineUsers.get(senderId);
      if (senderData) {
        io.to(senderData.socketId).emit('message_status', {
          messageId,
          status: 'seen',
        });
      }
    });

    // Handle friend request notification
    socket.on('friend_request_sent', ({ to, from }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('friend_request_received', { from });
      }
    });

    // Handle friend request accepted
    socket.on('friend_request_accepted_notify', ({ to, from }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('friend_request_accepted', { from });
      }
    });

    // Handle video call signals
    socket.on('call_user', ({ to, offer, from }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('incoming_call', {
          from,
          offer,
        });
      }
    });

    socket.on('call_accepted', ({ to, answer }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('call_accepted', { answer });
      }
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('ice_candidate', { candidate });
      }
    });

    socket.on('call_ended', ({ to }) => {
      const toData = onlineUsers.get(to);
      if (toData) {
        io.to(toData.socketId).emit('call_ended');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username}`);

      // Remove from online users
      onlineUsers.delete(socket.userId);

      // Update user status to offline
      User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        isOnline: false,
        lastSeen: Date.now(),
      }).exec();

      // Broadcast updated online users list
      const onlineUsersList = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
        userId,
        username: data.username,
        lastSeen: data.lastSeen,
      }));
      io.emit('online_users', onlineUsersList);

      // Notify specific users who might be chatting with this user
      io.emit('user_offline', { userId: socket.userId });
    });
  });

  // Return online users getter
  return {
    getOnlineUsers: () => Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      socketId: data.socketId,
      lastSeen: data.lastSeen,
    })),
    isUserOnline: (userId) => onlineUsers.has(userId),
    getUserSocketId: (userId) => onlineUsers.get(userId)?.socketId,
  };
};