import User from '../models/User.js';

// Active users mapping: userId -> socket.id
const onlineUsers = new Map();

export const getOnlineUsersList = () => {
  return Array.from(onlineUsers.keys());
};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Map user session
    socket.on('setup', async (userId) => {
      if (!userId) return;
      
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      
      // Update online status in database
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        // Broadcast updated list
        io.emit('online_users', getOnlineUsersList());
      } catch (err) {
        console.error('Setup online status database update error:', err);
      }

      socket.join(userId);
      console.log(`User ${userId} setup completed.`);
    });

    // Join Conversation Rooms
    socket.on('join_chat', (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // Leave Conversation Rooms
    socket.on('leave_chat', (chatId) => {
      if (!chatId) return;
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat room: ${chatId}`);
    });

    // Typing Indicators
    socket.on('typing', ({ chatId, username }) => {
      socket.in(chatId).emit('typing', { chatId, username });
    });

    socket.on('stop_typing', ({ chatId, username }) => {
      socket.in(chatId).emit('stop_typing', { chatId, username });
    });

    // Message Seen Event
    socket.on('message_seen', ({ messageId, chatId, userId }) => {
      socket.in(chatId).emit('message_seen', { messageId, chatId, userId });
    });

    // Disconnection Handlers
    socket.on('disconnect', async () => {
      console.log(`Socket Disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        try {
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false, 
            lastSeen: new Date() 
          });
          io.emit('online_users', getOnlineUsersList());
        } catch (err) {
          console.error('Disconnect status database update error:', err);
        }
      }
    });
  });
};

export default socketHandler;
export { onlineUsers };
