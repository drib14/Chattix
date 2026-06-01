import { create } from 'zustand';

const useChatStore = create((set) => ({
  selectedChat: null,
  chats: [],
  messages: [],
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setChats: (chats) => set({ chats }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));

export default useChatStore;
