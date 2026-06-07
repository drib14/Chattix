import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import themeReducer from './slices/themeSlice';
import friendReducer from './slices/friendSlice';
import notificationReducer from './slices/notificationSlice';
import groupReducer from './slices/groupSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    theme: themeReducer,
    friend: friendReducer,
    notification: notificationReducer,
    group: groupReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
