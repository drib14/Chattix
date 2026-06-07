import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedChat: null,
  messages: [],
  recentChats: [],
  groups: [],
  onlineUsers: [],
  typingUsers: {},
  unreadCounts: {},
  replyTo: null,
  loading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
      state.messages = [];
      state.replyTo = null;
    },
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    addMessage: (state, action) => {
      if (!Array.isArray(state.messages)) {
        state.messages = [];
      }
      const exists = state.messages.some(
        (m) => m._id === action.payload._id
      );
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex((m) => m._id === action.payload._id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload };
      }
    },
    setRecentChats: (state, action) => {
      state.recentChats = Array.isArray(action.payload) ? action.payload : [];
    },
    updateRecentChat: (state, action) => {
      const { userId, message } = action.payload;
      if (!userId || !message) return;

      const targetId = userId.toString();
      const chats = Array.isArray(state.recentChats) ? [...state.recentChats] : [];
      const index = chats.findIndex((c) => c._id?._id?.toString() === targetId);

      if (index !== -1) {
        chats[index] = { ...chats[index], lastMessage: message };
        const [updated] = chats.splice(index, 1);
        state.recentChats = [updated, ...chats];
      }
    },
    setGroups: (state, action) => {
      state.groups = Array.isArray(action.payload) ? action.payload : [];
    },
    addGroup: (state, action) => {
      state.groups.unshift(action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setTypingUser: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
    },
    incrementUnread: (state, action) => {
      const chatId = action.payload;
      state.unreadCounts[chatId] = (state.unreadCounts[chatId] || 0) + 1;
    },
    clearUnread: (state, action) => {
      const chatId = action.payload;
      state.unreadCounts[chatId] = 0;
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
    setReplyTo: (state, action) => {
      state.replyTo = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setSelectedChat,
  setMessages,
  addMessage,
  updateMessage,
  setRecentChats,
  updateRecentChat,
  setGroups,
  addGroup,
  setOnlineUsers,
  setTypingUser,
  incrementUnread,
  clearUnread,
  removeMessage,
  setReplyTo,
  setLoading,
} = chatSlice.actions;

export default chatSlice.reducer;
