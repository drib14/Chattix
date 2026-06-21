import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  selectedChat: null,
  messages: [],
  onlineUsers: [],
  token: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = Array.isArray(action.payload) ? action.payload : [];
    },
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = Array.isArray(action.payload) ? action.payload : [];
    },
    addMessage: (state, action) => {
      // Avoid duplicate keys
      const exists = state.messages.some((msg) => msg._id === action.payload._id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = Array.isArray(action.payload) ? action.payload : [];
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      // Update in local chats list
      state.chats = state.chats.map((c) => {
        if (c._id === chatId) {
          return { ...c, lastMessage: message };
        }
        return c;
      });
      // Sort chats so recent updates rise to top
      state.chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
  },
});

export const {
  setChats,
  setSelectedChat,
  setMessages,
  addMessage,
  setOnlineUsers,
  setToken,
  updateChatLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
