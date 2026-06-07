import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  groups: [],
  selectedGroup: null,
  loading: false,
  error: null,
};

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setGroups: (state, action) => {
      state.groups = Array.isArray(action.payload) ? action.payload : [];
    },
    addGroup: (state, action) => {
      const exists = state.groups.some(g => g._id === action.payload._id);
      if (!exists) {
        state.groups.unshift(action.payload);
      }
    },
    updateGroup: (state, action) => {
      const index = state.groups.findIndex(g => g._id === action.payload._id);
      if (index !== -1) {
        state.groups[index] = action.payload;
      }
      if (state.selectedGroup?._id === action.payload._id) {
        state.selectedGroup = action.payload;
      }
    },
    removeGroup: (state, action) => {
      state.groups = state.groups.filter(g => g._id !== action.payload);
      if (state.selectedGroup?._id === action.payload) {
        state.selectedGroup = null;
      }
    },
    setSelectedGroup: (state, action) => {
      state.selectedGroup = action.payload;
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
  setGroups,
  addGroup,
  updateGroup,
  removeGroup,
  setSelectedGroup,
  setLoading,
  setError,
} = groupSlice.actions;

export default groupSlice.reducer;
