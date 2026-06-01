import { create } from 'zustand';

interface ChatState {
  selectedChat: any;
  chats: any[];
  messages: any[];
  setSelectedChat: (chat: any) => void;
  setChats: (chats: any[]) => void;
  setMessages: (messages: any[]) => void;
  addMessage: (message: any) => void;
}

const useChatStore = create<ChatState>((set) => ({
  selectedChat: null,
  chats: [],
  messages: [],
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setChats: (chats) => set({ chats }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));

export default useChatStore;