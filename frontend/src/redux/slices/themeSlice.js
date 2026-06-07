import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'light',
  language: localStorage.getItem('language') || 'en',
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
  },
});

export const { setTheme, setLanguage } = themeSlice.actions;
export default themeSlice.reducer;
