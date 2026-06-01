import { Server } from 'socket.io';
import User from '../models/User.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const userSocketMap = new Map();

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on('setup', async (userData) => {
      socket.join(userData._id);
      userSocketMap.set(socket.id, userData._id);
      await User.findByIdAndUpdate(userData._id, { isOnline: true, lastSeen: new Date() });
      socket.broadcast.emit('user online', userData._id);
      socket.emit('connected');
    });

    socket.on('join chat', (room) => {
      socket.join(room);
      console.log(`User Joined Room: ${room}`);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', (newMessageRecieved) => {
      let chat = newMessageRecieved.conversationId;

      if (!chat.participants) return console.log('chat.participants not defined');

      chat.participants.forEach((participant) => {
        if (participant._id === newMessageRecieved.sender._id) return;

        socket.in(participant._id).emit('message recieved', newMessageRecieved);
      });
    });

    socket.on('disconnect', async () => {
      console.log('USER DISCONNECTED', socket.id);
      const userId = userSocketMap.get(socket.id);
      if (userId) {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          socket.broadcast.emit('user offline', userId);
          userSocketMap.delete(socket.id);
      }
    });
  });

  return io;
};
