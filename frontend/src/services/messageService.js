import api from './api';

const ensureArray = (data) => (Array.isArray(data) ? data : []);

export const messageService = {
  sendMessage: async (data, files) => {
    const formData = new FormData();
    if (data.text) formData.append('text', data.text);
    if (data.receiverId) formData.append('receiverId', data.receiverId);
    if (data.groupId) formData.append('groupId', data.groupId);
    if (data.replyTo) formData.append('replyTo', data.replyTo);

    if (files?.length) {
      files.forEach((file) => formData.append('attachments', file));
    }

    const response = await api.post('/messages/send', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  getMessages: async (userId, page = 1) => {
    const response = await api.get(`/messages/${userId}?page=${page}`);
    const data = response.data;
    if (Array.isArray(data)) return { messages: data, success: true };
    return { ...data, messages: ensureArray(data?.messages) };
  },

  getGroupMessages: async (groupId, page = 1) => {
    const response = await api.get(`/messages/group/${groupId}?page=${page}`);
    const data = response.data;
    return { ...data, messages: ensureArray(data?.messages) };
  },

  getRecentChats: async () => ensureArray((await api.get('/messages/recent')).data),

  markAsDelivered: async (messageId) =>
    (await api.put(`/messages/${messageId}/delivered`)).data,

  markAsSeen: async (messageId) => (await api.put(`/messages/${messageId}/seen`)).data,

  addReaction: async (messageId, emoji) =>
    (await api.post(`/messages/${messageId}/react`, { emoji })).data,

  togglePin: async (messageId) => (await api.put(`/messages/${messageId}/pin`)).data,

  toggleStar: async (messageId) => (await api.put(`/messages/${messageId}/star`)).data,

  editMessage: async (messageId, text) =>
    (await api.put(`/messages/${messageId}/edit`, { text })).data,

  deleteForMe: async (messageId) =>
    (await api.delete(`/messages/${messageId}/me`)).data,

  deleteForEveryone: async (messageId) =>
    (await api.delete(`/messages/${messageId}/everyone`)).data,

  forwardMessage: async (messageId, receiverId) =>
    (await api.post(`/messages/${messageId}/forward`, { receiverId })).data,

  clearChat: async (userId) => (await api.delete(`/messages/clear/${userId}`)).data,

  deleteMessage: async (messageId) => (await api.delete(`/messages/${messageId}`)).data,

  searchMessages: async (query, chatId, isGroup = false) => {
    const params = new URLSearchParams({ query });
    if (chatId) {
      params.append('chatId', chatId);
      params.append('isGroup', isGroup ? 'true' : 'false');
    }
    return ensureArray((await api.get(`/messages/search?${params.toString()}`)).data);
  },

  // Poll methods
  createPoll: async (groupId, question, options, allowMultipleVotes = false) => {
    const response = await api.post('/messages/poll', {
      groupId,
      question,
      options,
      allowMultipleVotes,
    });
    return response.data;
  },

  votePoll: async (messageId, optionIndex) => {
    const response = await api.post(`/messages/poll/${messageId}/vote`, { optionIndex });
    return response.data;
  },

  unvotePoll: async (messageId, optionIndex) => {
    const response = await api.post(`/messages/poll/${messageId}/unvote`, { optionIndex });
    return response.data;
  },
};
