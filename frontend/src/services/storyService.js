import api from './api';

export const storyService = {
  createStory: async (mediaFile, caption, audience) => {
    const formData = new FormData();
    formData.append('media', mediaFile);
    if (caption) formData.append('caption', caption);
    if (audience) formData.append('audience', audience);

    const response = await api.post('/stories', formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  getFeedStories: async () => {
    const response = await api.get('/stories');
    return response.data;
  },

  markStoryViewed: async (storyId) => {
    const response = await api.put(`/stories/${storyId}/view`);
    return response.data;
  },

  deleteStory: async (storyId) => {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  },
};
