import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = Array.isArray(action.payload) ? action.payload : [];
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload || 0;
    },
    addNotification: (state, action) => {
      if (!Array.isArray(state.notifications)) state.notifications = [];
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find((x) => x._id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.read = true; });
      state.unreadCount = 0;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  addNotification,
  markNotificationRead,
  markAllRead,
  setLoading,
} = notificationSlice.actions;

export default notificationSlice.reducer;
