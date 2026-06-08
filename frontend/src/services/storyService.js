import api from './api';

export const storyService = {
  createStory: async (mediaFile, caption, audience, textMode = false, backgroundColor = '', fontFamily = '', fontColor = '', overlays = []) => {
    const formData = new FormData();
    if (mediaFile) formData.append('media', mediaFile);
    if (caption) formData.append('caption', caption);
    if (audience) formData.append('audience', audience);
    if (textMode) formData.append('textMode', 'true');
    if (backgroundColor) formData.append('backgroundColor', backgroundColor);
    if (fontFamily) formData.append('fontFamily', fontFamily);
    if (fontColor) formData.append('fontColor', fontColor);
    if (overlays && overlays.length > 0) formData.append('overlays', JSON.stringify(overlays));

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

  reactToStory: async (storyId, emoji) => {
    const response = await api.post(`/stories/${storyId}/react`, { emoji });
    return response.data;
  },
};
