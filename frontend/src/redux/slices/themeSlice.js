import { createSlice } from '@reduxjs/toolkit';

// Theme definitions — each theme has: wallpaper, bubble colors, accent, quick reaction
export const CHAT_THEMES = {
  default: {
    name: 'Default',
    emoji: '💬',
    wallpaper: 'default',
    bubbleOwn: '#4A90E2',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#FFFFFF',
    bubbleOtherText: '#1A202C',
    accent: '#4A90E2',
    quickReaction: '👍',
    gradient: 'linear-gradient(135deg, #4A90E2, #357ABD)',
  },
  ocean: {
    name: 'Ocean',
    emoji: '🌊',
    wallpaper: 'ocean',
    bubbleOwn: '#0EA5E9',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#E0F2FE',
    bubbleOtherText: '#0C4A6E',
    accent: '#0EA5E9',
    quickReaction: '🌊',
    gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
  },
  sunset: {
    name: 'Sunset',
    emoji: '🌅',
    wallpaper: 'sunset',
    bubbleOwn: '#F97316',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#FFF7ED',
    bubbleOtherText: '#7C2D12',
    accent: '#F97316',
    quickReaction: '🔥',
    gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
  },
  aurora: {
    name: 'Aurora',
    emoji: '🌌',
    wallpaper: 'aurora',
    bubbleOwn: '#8B5CF6',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#F5F3FF',
    bubbleOtherText: '#4C1D95',
    accent: '#8B5CF6',
    quickReaction: '✨',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  },
  lavender: {
    name: 'Lavender',
    emoji: '💜',
    wallpaper: 'lavender',
    bubbleOwn: '#A855F7',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#FAF5FF',
    bubbleOtherText: '#581C87',
    accent: '#A855F7',
    quickReaction: '💜',
    gradient: 'linear-gradient(135deg, #A855F7, #9333EA)',
  },
  forest: {
    name: 'Forest',
    emoji: '🌿',
    wallpaper: 'forest',
    bubbleOwn: '#22C55E',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#F0FDF4',
    bubbleOtherText: '#14532D',
    accent: '#22C55E',
    quickReaction: '🌿',
    gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
  },
  love: {
    name: 'Love',
    emoji: '❤️',
    wallpaper: 'love',
    bubbleOwn: '#E11D48',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#FFF1F2',
    bubbleOtherText: '#881337',
    accent: '#E11D48',
    quickReaction: '❤️',
    gradient: 'linear-gradient(135deg, #E11D48, #BE123C)',
  },
  midnight: {
    name: 'Midnight',
    emoji: '🌙',
    wallpaper: 'midnight',
    bubbleOwn: '#6366F1',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#1E1B4B',
    bubbleOtherText: '#E0E7FF',
    accent: '#6366F1',
    quickReaction: '🌙',
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
  },
  tiedye: {
    name: 'Tie-Dye',
    emoji: '🎨',
    wallpaper: 'tiedye',
    bubbleOwn: '#EC4899',
    bubbleOwnText: '#FFFFFF',
    bubbleOther: '#FDF2F8',
    bubbleOtherText: '#831843',
    accent: '#EC4899',
    quickReaction: '🎨',
    gradient: 'linear-gradient(135deg, #EC4899, #F97316, #8B5CF6)',
  },
};

const initialState = {
  mode: 'light',
  language: localStorage.getItem('language') || 'en',
  chatTheme: localStorage.getItem('chatTheme') || 'default',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state) => {
      state.mode = 'light';
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setChatTheme: (state, action) => {
      state.chatTheme = action.payload;
      localStorage.setItem('chatTheme', action.payload);
    },
  },
});

export const { setTheme, setLanguage, setChatTheme } = themeSlice.actions;
export default themeSlice.reducer;
