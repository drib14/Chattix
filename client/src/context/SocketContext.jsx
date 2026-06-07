import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    if (!currentUser) return;

    // Connect to server
    socketRef.current = io('http://localhost:5000'); // Ensure this is correct in production

    socketRef.current.on('connect', () => {
      socketRef.current.emit('user_connected', currentUser.id || currentUser._id);
    });

    socketRef.current.on('update_active_users', (userIds) => {
      setOnlineUserIds(userIds);
    });

    socketRef.current.on('typing', ({ senderId }) => {
      setTypingUsers(prev => new Set(prev).add(senderId));
    });

    socketRef.current.on('stop_typing', ({ senderId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUser]);

  const emitTyping = (recipientId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { recipientId });
    }
  };

  const emitStopTyping = (recipientId) => {
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { recipientId });
    }
  };

  const emitMessage = (recipientId, message) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { recipientId, message });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket: socketRef.current, 
      onlineUserIds, 
      typingUsers,
      emitTyping,
      emitStopTyping,
      emitMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};
