import api from './api';

export const groupService = {
  // Basic group operations
  createGroup: async (data) => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  getUserGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data;
  },

  // Group settings
  updateGroupSettings: async (groupId, settings) => {
    const response = await api.put(`/groups/${groupId}/settings`, settings);
    return response.data;
  },

  // Avatar operations
  uploadGroupAvatar: async (groupId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeGroupAvatar: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}/avatar`);
    return response.data;
  },

  // Member management
  addMembers: async (groupId, members) => {
    const response = await api.post(`/groups/${groupId}/members`, { members });
    return response.data;
  },

  removeMember: async (groupId, memberId) => {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  },

  getGroupMembers: async (groupId, search = '') => {
    const params = search ? { search } : {};
    const response = await api.get(`/groups/${groupId}/members`, { params });
    return response.data;
  },

  // Admin operations
  promoteToAdmin: async (groupId, memberId) => {
    const response = await api.post(`/groups/${groupId}/members/${memberId}/promote`);
    return response.data;
  },

  demoteAdmin: async (groupId, memberId) => {
    const response = await api.post(`/groups/${groupId}/members/${memberId}/demote`);
    return response.data;
  },

  transferAdmin: async (groupId, newAdminId) => {
    const response = await api.post(`/groups/${groupId}/transfer-admin/${newAdminId}`);
    return response.data;
  },

  // Group membership
  leaveGroup: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },

  // Invite system
  regenerateInviteCode: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/regenerate-invite`);
    return response.data;
  },

  joinGroupViaInvite: async (inviteCode) => {
    const response = await api.post(`/groups/join/${inviteCode}`);
    return response.data;
  },

  // Message operations
  pinMessage: async (groupId, messageId) => {
    const response = await api.post(`/groups/${groupId}/pin-message/${messageId}`);
    return response.data;
  },

  // Media and files
  getGroupMedia: async (groupId, type = 'all', page = 1, limit = 20) => {
    const response = await api.get(`/groups/${groupId}/media`, {
      params: { type, page, limit },
    });
    return response.data;
  },
};
