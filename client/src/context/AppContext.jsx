import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AppProvider = ({ children }) => {
  const [user, setUserRaw] = useState(null);
  const setUser = (val) => {
    if (typeof val === 'function') {
      setUserRaw((prev) => {
        const res = val(prev);
        if (res && typeof res === 'object') {
          const id = res._id || res.id;
          return { ...res, id, _id: id };
        }
        return res;
      });
    } else if (val && typeof val === 'object') {
      const id = val._id || val.id;
      setUserRaw({
        ...val,
        id,
        _id: id,
      });
    } else {
      setUserRaw(val);
    }
  };
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [favoriteContacts, setFavoriteContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: [username] }
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);

  // Trigger Toast Alert Notification
  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => {
      setToast({ show: false, text: '', type: 'success' });
    }, 4000);
  };

  // Multiple Saved Accounts Switcher Helpers
  const saveAccountSession = (usr, tkn) => {
    if (!usr || !tkn) return;
    try {
      const saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
      const cleaned = saved.filter(acc => acc.id !== usr.id);
      cleaned.push({
        id: usr.id,
        username: usr.username,
        profilePhoto: usr.profilePhoto || '',
        token: tkn
      });
      localStorage.setItem('chattix_saved_accounts', JSON.stringify(cleaned));
    } catch(e) {
      console.error('Error saving account session:', e);
    }
  };

  const switchSavedAccount = (userId) => {
    try {
      const saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
      const targetAcc = saved.find(acc => acc.id === userId);
      if (targetAcc) {
        localStorage.setItem('token', targetAcc.token);
        window.location.reload();
      } else {
        showToast('Saved account session not found.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Get current user session on load
  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  // Handle Socket initialization when user is loaded
  useEffect(() => {
    if (user && user.id) {
      // Connect socket
      const socket = io(API_URL);
      socketRef.current = socket;

      // Setup session
      socket.emit('setup', user);

      // Sockets Listeners
      socket.on('connected_users', (users) => {
        setOnlineUsers(users);
      });

      socket.on('user_status_change', (data) => {
        // data: { userId, isOnline, lastSeen }
        setOnlineUsers((prev) => {
          if (data.isOnline) {
            return Array.from(new Set([...prev, data.userId]));
          } else {
            return prev.filter((id) => id !== data.userId);
          }
        });
        
        // Dynamically update online status in conversation lists
        setConversations((prev) =>
          prev.map((c) => {
            const updatedParticipants = c.participants.map((p) =>
              p._id === data.userId ? { ...p, isOnline: data.isOnline, lastSeen: data.lastSeen } : p
            );
            return { ...c, participants: updatedParticipants };
          })
        );

        if (currentChat) {
          const updatedParticipants = currentChat.participants.map((p) =>
            p._id === data.userId ? { ...p, isOnline: data.isOnline, lastSeen: data.lastSeen } : p
          );
          setCurrentChat((prev) => ({ ...prev, participants: updatedParticipants }));
        }
      });

      socket.on('message_received', (newMessage) => {
        const chatRoom = newMessage.conversationId;
        
        // If current active chat, append message
        if (currentChat && currentChat._id === chatRoom) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
          // Read receipts
          socket.emit('message_read', {
            messageId: newMessage._id,
            conversationId: chatRoom,
            userId: user.id,
          });
        }

        // Update lastMessage pointer in conversations sidebar list
        setConversations((prev) => {
          const mapped = prev.map((c) => {
            if (c._id === chatRoom) {
              return { ...c, lastMessage: newMessage, updatedAt: new Date() };
            }
            return c;
          });
          return mapped.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      });

      socket.on('message_edited', (updatedMessage) => {
        if (currentChat && currentChat._id === updatedMessage.conversationId) {
          setMessages((prev) => prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)));
        }
      });

      socket.on('message_deleted', (deletedMessage) => {
        if (currentChat && currentChat._id === deletedMessage.conversationId) {
          setMessages((prev) => prev.map((m) => (m._id === deletedMessage._id ? deletedMessage : m)));
        }
      });

      socket.on('pinned_messages_updated', (data) => {
        if (currentChat && currentChat._id === data.conversationId) {
          setCurrentChat((prev) => ({ ...prev, pinnedMessages: data.pinnedMessages }));
        }
      });

      socket.on('conversation_customized', (updatedConv) => {
        setConversations((prev) =>
          prev.map((c) => (c._id === updatedConv._id ? updatedConv : c))
        );
        if (currentChat && currentChat._id === updatedConv._id) {
          setCurrentChat(updatedConv);
        }
      });

      socket.on('typing_received', (data) => {
        setTypingUsers((prev) => {
          const list = prev[data.conversationId] || [];
          if (list.includes(data.username)) return prev;
          return { ...prev, [data.conversationId]: [...list, data.username] };
        });
      });

      socket.on('stop_typing_received', (data) => {
        setTypingUsers((prev) => {
          const list = prev[data.conversationId] || [];
          return { ...prev, [data.conversationId]: list.filter((u) => u !== data.username) };
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [user, currentChat]);

  // Join chat rooms on change
  useEffect(() => {
    if (socketRef.current && currentChat) {
      socketRef.current.emit('join_room', currentChat._id);
      fetchMessages(currentChat._id);

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave_room', currentChat._id);
        }
      };
    }
  }, [currentChat]);

  // API Call Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  });

  // fetch user session
  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        saveAccountSession(data.user, token);
      } else {
        logoutUser();
      }
    } catch (error) {
      console.error(error);
      logoutUser();
    }
  };

  // Register
  const registerUser = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('Connection failed. Server is offline.', 'error');
      return { success: false };
    }
  };

  // Email verification check
  const verifyCode = async (email, code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        saveAccountSession(data.user, data.token);
        showToast('Email verified successfully!', 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('Verification failed. Connection error.', 'error');
      return { success: false };
    }
  };

  // Login
  const loginUser = async (loginIdentifier, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        saveAccountSession(data.user, data.token);
        showToast('Welcome back!', 'success');
      } else {
        showToast(data.message, data.isNotVerified ? 'info' : 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('Login failed. Connection error.', 'error');
      return { success: false };
    }
  };

  // Logout
  const logoutUser = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    setConversations([]);
    setCurrentChat(null);
    setMessages([]);
    showToast('Logged out successfully.', 'info');
  };

  // Forgot password request
  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('Connection failed.', 'error');
      return { success: false };
    }
  };

  // Reset password
  const resetPassword = async (email, code, newPassword) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('Password reset connection error.', 'error');
      return { success: false };
    }
  };

  // Conversations retrieval
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Get messages for active conversation
  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Send a regular text message or quote-reply
  const sendMessage = async (content, parentMessageId = null) => {
    if (!currentChat) return;
    try {
      const res = await fetch(`${API_URL}/api/chats/${currentChat._id}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, parentMessageId, messageType: 'text' }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(error);
      showToast('Failed to send message.', 'error');
    }
  };

  // Send images, videos, audio voice notes or documents to Cloudinary
  const sendMediaMessage = async (file, messageType, parentMessageId = null) => {
    if (!currentChat) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messageType', messageType);
    if (parentMessageId) formData.append('parentMessageId', parentMessageId);

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/chats/${currentChat._id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      console.error(error);
      showToast('Media upload failed.', 'error');
    }
  };

  // Edit Message
  const editMessage = async (messageId, newContent) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ content: newContent }),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  // Delete message for everyone
  const deleteMessage = async (messageId) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  // Toggle Pinned status
  const togglePin = async (messageId) => {
    if (!currentChat) return;
    try {
      const res = await fetch(`${API_URL}/api/chats/${currentChat._id}/messages/${messageId}/pin`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Create Conversation or Group
  const createChat = async (isGroup, participants, name = '', avatar = '') => {
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ isGroup, participants, name, avatar }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh and select
        await fetchConversations();
        setCurrentChat(data.conversation);
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Update custom user profile details
  const updateProfile = async (statusText, profilePhoto = '') => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ statusText, profilePhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch all Contacts and Requests
  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        setPendingRequests(data.pendingRequests);
        setSentRequests(data.sentRequests);
        setBlockedUsers(data.blockedUsers);
        setFavoriteContacts(data.favoriteContacts);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Search User by term
  const searchUsers = async (query) => {
    try {
      const res = await fetch(`${API_URL}/api/users/search?query=${query}`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false, users: [] };
    }
  };

  // Send contact request
  const sendRequest = async (recipientId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Accept request
  const acceptRequest = async (senderId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/accept`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ senderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
        fetchConversations();
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Decline request
  const rejectRequest = async (senderId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/reject`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ senderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'info');
        fetchContacts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Favorite toggle
  const toggleFavorite = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/favorite`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Remove contact
  const removeContact = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/${contactId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
        fetchConversations();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Update Chat customization (Theme, Emoji & Background)
  const updateConversationCustomization = async (chatId, themeColor, themeEmoji, themeBackground) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/customization`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ themeColor, themeEmoji, themeBackground }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh conversations & current chat locally
        setConversations((prev) =>
          prev.map((c) => (c._id === chatId ? data.conversation : c))
        );
        if (currentChat && currentChat._id === chatId) {
          setCurrentChat(data.conversation);
        }
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
      showToast('Failed to update chat customization.', 'error');
    }
  };

  // Upload Custom Sticker to Cloudinary
  const uploadCustomSticker = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/stickers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        showToast(data.message, 'success');
        setUser(prev => ({ ...prev, stickers: data.stickers }));
        return data.stickers;
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      showToast('Sticker upload failed.', 'error');
    }
  };

  // Get Custom Stickers
  const getCustomStickers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/stickers`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        return data.stickers;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // Emit typing indicators on input change
  const sendTypingStatus = (isTyping) => {
    if (!socketRef.current || !currentChat) return;
    const event = isTyping ? 'typing' : 'stop_typing';
    socketRef.current.emit(event, {
      conversationId: currentChat._id,
      username: user.username,
    });
  };

  // Send custom reactions
  const sendReaction = (messageId, emoji) => {
    if (!socketRef.current || !currentChat) return;
    
    // Optimistic state updates
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id === messageId) {
          const cleanReactions = m.reactions.filter((r) => r.user.toString() !== user.id.toString());
          return {
            ...m,
            reactions: [...cleanReactions, { user: user.id, emoji }],
          };
        }
        return m;
      })
    );

    socketRef.current.emit('reaction_add', {
      messageId,
      conversationId: currentChat._id,
      reaction: { user: { id: user.id, username: user.username }, emoji },
    });
  };

  // Change username
  const changeUsername = async (username) => {
    try {
      const res = await fetch(`${API_URL}/api/users/username`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Update privacy settings
  const updatePrivacy = async (lastSeen, onlineStatus, readReceipts) => {
    try {
      const res = await fetch(`${API_URL}/api/users/privacy`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ lastSeen, onlineStatus, readReceipts }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, privacySettings: data.privacySettings }));
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Block User
  const blockUser = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/block`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
        fetchConversations();
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Unblock User
  const unblockUser = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/unblock`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Categorize Contact
  const categorizeContact = async (contactId, category) => {
    try {
      const res = await fetch(`${API_URL}/api/users/contacts/category`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ contactId, category }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts();
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Active Sessions
  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sessions`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false, sessions: [] };
    }
  };

  // Revoke Session
  const revokeSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Toggle 2FA
  const toggle2FA = async (code, enable) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/2fa/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code, enable }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, twoFactorEnabled: data.twoFactorEnabled }));
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Verify 2FA Login
  const verify2FALogin = async (email, code) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        saveAccountSession(data.user, data.token);
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      setLoading(false);
      showToast('2FA login failed.', 'error');
      return { success: false };
    }
  };

  // Update Group permissions
  const updateGroupPermissions = async (chatId, announcementsOnly, allowMemberInvites, allowMemberPins) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/permissions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ announcementsOnly, allowMemberInvites, allowMemberPins }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        if (currentChat && currentChat._id === chatId) {
          setCurrentChat(prev => ({ ...prev, groupPermissions: data.groupPermissions }));
        }
        fetchConversations();
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Invite Link Token
  const fetchInviteLink = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/invite`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  // Join group via invite token
  const joinGroupByInvite = async (inviteToken) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/join/${inviteToken}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await fetchConversations();
        setCurrentChat(data.conversation);
      } else {
        showToast(data.message, 'error');
      }
      return data;
    } catch (error) {
      console.error(error);
      showToast('Failed to join group chat.', 'error');
    }
  };

  // Create Group Poll
  const createPoll = async (chatId, question, options) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/poll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question, options }),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  // Cast vote on Poll Option
  const votePoll = async (chatId, messageId, optionIndex) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/poll/${messageId}/vote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ optionIndex }),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Shared Group Files Locker
  const fetchGroupFiles = async (chatId) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/files`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false, files: [] };
    }
  };

  // Fetch Administration Stats & Analytics (BypassAdmin=true enables visualization)
  const fetchAdminAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/admin/analytics?bypassAdmin=true`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  // Toggle user suspension
  const toggleSuspendUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/admin/users/${userId}/suspend?bypassAdmin=true`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      }
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch toxic reports from AI engine logs
  const fetchToxicityLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/admin/toxicity?bypassAdmin=true`, {
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  };

  // AI extraction removed

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        conversations,
        setConversations,
        currentChat,
        setCurrentChat,
        messages,
        setMessages,
        contacts,
        pendingRequests,
        sentRequests,
        blockedUsers,
        favoriteContacts,
        onlineUsers,
        typingUsers,
        toast,
        showToast,
        loading,
        setLoading,
        registerUser,
        verifyCode,
        loginUser,
        logoutUser,
        forgotPassword,
        resetPassword,
        fetchConversations,
        sendMessage,
        sendMediaMessage,
        editMessage,
        deleteMessage,
        togglePin,
        createChat,
        updateProfile,
        fetchContacts,
        searchUsers,
        sendRequest,
        acceptRequest,
        rejectRequest,
        toggleFavorite,
        removeContact,
        sendTypingStatus,
        sendReaction,
        changeUsername,
        updatePrivacy,
        blockUser,
        unblockUser,
        categorizeContact,
        fetchActiveSessions,
        revokeSession,
        toggle2FA,
        verify2FALogin,
        updateGroupPermissions,
        fetchInviteLink,
        joinGroupByInvite,
        createPoll,
        votePoll,
        fetchGroupFiles,
        fetchAdminAnalytics,
        toggleSuspendUser,
        fetchToxicityLogs,
        updateConversationCustomization,
        switchSavedAccount,
        uploadCustomSticker,
        getCustomStickers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
