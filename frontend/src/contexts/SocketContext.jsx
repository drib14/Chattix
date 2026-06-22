import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { useAuth, useUser } from '@clerk/clerk-react';
import { addMessage, setOnlineUsers, setTypingStatus } from '../store/chatSlice';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

import { useAppAuth } from './AuthContext'; // Import this to get the mongo db user

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { dbUser } = useAppAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // Only connect when we have resolved the mongo DB user id
    if (dbUser) {
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        query: {
          userId: dbUser._id // Send MongoDB ID
        }
      });

      setSocket(socketInstance);

      // --- Listeners ---

      socketInstance.on('newMessage', (message) => {
        dispatch(addMessage(message));
      });

      socketInstance.on('userOnlineStatus', ({ userId, isOnline, lastSeen }) => {
        // We'll dispatch a thunk or action to update the user list online status
        // For now, we can handle it at the component level or expand the Redux state
      });

      socketInstance.on('typing', ({ conversationId, senderId }) => {
        dispatch(setTypingStatus({ conversationId, userId: senderId, isTyping: true }));
      });

      socketInstance.on('stopTyping', ({ conversationId, senderId }) => {
        dispatch(setTypingStatus({ conversationId, userId: senderId, isTyping: false }));
      });

      socketInstance.on('messageDeleted', ({ messageId, conversationId }) => {
        // Optionally handle message deletion in Redux
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [dbUser, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
