import api from './api';

const ensureArray = (data) => (Array.isArray(data) ? data : []);

export const notificationService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return ensureArray(response.data);
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data?.count || 0;
  },

  markAsRead: async (id) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all');
  },

  delete: async (id) => {
    await api.delete(`/notifications/${id}`);
  },
};
