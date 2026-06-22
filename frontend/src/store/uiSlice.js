import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSearchModalOpen: false,
  isForwardModalOpen: false,
  forwardMessageId: null,
  isDeleteModalOpen: false,
  deleteMessageId: null,
  replyingToMessage: null, // Holds message object if replying
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSearchModal: (state, action) => {
      state.isSearchModalOpen = action.payload ?? !state.isSearchModalOpen;
    },
    openForwardModal: (state, action) => {
      state.isForwardModalOpen = true;
      state.forwardMessageId = action.payload;
    },
    closeForwardModal: (state) => {
      state.isForwardModalOpen = false;
      state.forwardMessageId = null;
    },
    openDeleteModal: (state, action) => {
      state.isDeleteModalOpen = true;
      state.deleteMessageId = action.payload;
    },
    closeDeleteModal: (state) => {
      state.isDeleteModalOpen = false;
      state.deleteMessageId = null;
    },
    setReplyingTo: (state, action) => {
      state.replyingToMessage = action.payload;
    },
    clearReplyingTo: (state) => {
      state.replyingToMessage = null;
    }
  }
});

export const {
  toggleSearchModal,
  openForwardModal,
  closeForwardModal,
  openDeleteModal,
  closeDeleteModal,
  setReplyingTo,
  clearReplyingTo
} = uiSlice.actions;

export default uiSlice.reducer;
