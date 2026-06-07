import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  loading: false,
  error: null,
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setFriends: (state, action) => {
      state.friends = Array.isArray(action.payload) ? action.payload : [];
    },
    setPendingRequests: (state, action) => {
      state.pendingRequests = Array.isArray(action.payload) ? action.payload : [];
    },
    setSentRequests: (state, action) => {
      state.sentRequests = Array.isArray(action.payload) ? action.payload : [];
    },
    addFriend: (state, action) => {
      state.friends.push(action.payload);
    },
    removeFriend: (state, action) => {
      state.friends = state.friends.filter(
        (f) => f._id?.toString() !== action.payload?.toString()
      );
    },
    addPendingRequest: (state, action) => {
      state.pendingRequests.push(action.payload);
    },
    removePendingRequest: (state, action) => {
      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id?.toString() !== action.payload?.toString()
      );
    },
    acceptFriendRequest: (state, action) => {
      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id?.toString() !== action.payload?.toString()
      );
    },
    rejectFriendRequest: (state, action) => {
      state.pendingRequests = state.pendingRequests.filter(
        (r) => r._id?.toString() !== action.payload?.toString()
      );
    },
    addSentRequest: (state, action) => {
      state.sentRequests.push(action.payload);
    },
    cancelSentRequest: (state, action) => {
      state.sentRequests = state.sentRequests.filter(
        (r) => r._id?.toString() !== action.payload?.toString()
      );
    },
    removeSentRequest: (state, action) => {
      state.sentRequests = state.sentRequests.filter(
        (r) => r._id?.toString() !== action.payload?.toString()
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFriends,
  setPendingRequests,
  setSentRequests,
  addFriend,
  removeFriend,
  addPendingRequest,
  removePendingRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  addSentRequest,
  cancelSentRequest,
  removeSentRequest,
  setLoading,
  setError,
} = friendSlice.actions;

export default friendSlice.reducer;
