import api from './api';

const ensureArray = (data) => (Array.isArray(data) ? data : []);

export const friendService = {
  getFriends: async () => {
    const response = await api.get('/friends');
    return ensureArray(response.data);
  },

  getPendingRequests: async () => {
    const response = await api.get('/friends/requests/pending');
    return ensureArray(response.data);
  },

  getSentRequests: async () => {
    const response = await api.get('/friends/requests/sent');
    return ensureArray(response.data);
  },

  getFriendshipStatus: async (userId) => {
    const response = await api.get(`/friends/status/${userId}`);
    return response.data;
  },

  sendFriendRequest: async (userId) => {
    const response = await api.post(`/friends/request/${userId}`);
    return response.data;
  },

  acceptFriendRequest: async (userId) => {
    const response = await api.post(`/friends/accept/${userId}`);
    return response.data;
  },

  rejectFriendRequest: async (userId) => {
    const response = await api.post(`/friends/reject/${userId}`);
    return response.data;
  },

  cancelSentRequest: async (userId) => {
    const response = await api.delete(`/friends/cancel/${userId}`);
    return response.data;
  },

  removeFriend: async (userId) => {
    const response = await api.delete(`/friends/${userId}`);
    return response.data;
  },

  getMutualFriends: async (userId) => {
    const response = await api.get(`/friends/mutual/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};
