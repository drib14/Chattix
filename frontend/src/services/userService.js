import api from './api';

export const userService = {
  // Profile management
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  uploadCover: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('coverImage', file);
    const response = await api.post('/users/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Account management
  changePassword: async (data) => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/delete');
    return response.data;
  },

  // Archive chat
  archiveChat: async (chatId, chatType = 'user') => {
    const response = await api.post('/users/archive-chat', { chatId, chatType });
    return response.data;
  },

  unarchiveChat: async (chatId) => {
    const response = await api.delete(`/users/archive-chat/${chatId}`);
    return response.data;
  },

  getArchivedChats: async () => {
    const response = await api.get('/users/archived-chats');
    return response.data;
  },

  // Wallpaper
  setChatWallpaper: async (chatId, wallpaper, chatType = 'user', customUrl = null) => {
    const response = await api.post('/users/set-wallpaper', {
      chatId,
      chatType,
      wallpaper,
      customUrl,
    });
    return response.data;
  },

  getChatWallpaper: async (chatId) => {
    const response = await api.get(`/users/wallpaper/${chatId}`);
    return response.data;
  },

  // Unread count
  updateUnreadCount: async (chatId, count, chatType = 'user') => {
    const response = await api.post('/users/unread-count', {
      chatId,
      chatType,
      count,
    });
    return response.data;
  },

  // User status
  getUserStatus: async (userId) => {
    const response = await api.get(`/users/status/${userId}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const params = new URLSearchParams({ q: query });
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  // Mention search
  searchUsersForMentions: async (query, groupId = null) => {
    const params = new URLSearchParams({ q: query });
    if (groupId) {
      params.append('groupId', groupId);
    }
    const response = await api.get(`/users/mention-search?${params.toString()}`);
    return response.data;
  },
};