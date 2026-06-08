import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storyService } from '../../services/storyService';

export const fetchStories = createAsyncThunk(
  'story/fetchStories',
  async (_, { rejectWithValue }) => {
    try {
      const data = await storyService.getFeedStories();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stories');
    }
  }
);

export const createStory = createAsyncThunk(
  'story/createStory',
  async ({ mediaFile, caption, audience }, { rejectWithValue }) => {
    try {
      const data = await storyService.createStory(mediaFile, caption, audience);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create story');
    }
  }
);

export const markStoryViewed = createAsyncThunk(
  'story/markStoryViewed',
  async (storyId, { rejectWithValue }) => {
    try {
      const data = await storyService.markStoryViewed(storyId);
      return { storyId, ...data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark story viewed');
    }
  }
);

const storySlice = createSlice({
  name: 'story',
  initialState: {
    stories: [], // Array of story objects
    groupedStories: [], // Grouped by user: [{ user, stories: [] }]
    loading: false,
    error: null,
  },
  reducers: {
    groupStories: (state, action) => {
      const currentUserId = action.payload; // Pass current user ID to put their stories first
      
      const userMap = new Map();
      state.stories.forEach(story => {
        const userId = story.user?._id;
        if (!userId) return;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user: story.user,
            stories: [],
            hasUnviewed: false,
            highestPriorityAudience: 'public', // to determine border color
          });
        }
        
        const userGroup = userMap.get(userId);
        userGroup.stories.push(story);
        
        const isViewed = story.viewedBy.includes(currentUserId);
        if (!isViewed) {
          userGroup.hasUnviewed = true;
          // Priority logic for border: if any unviewed is 'only_me', use that. Else 'friends', else 'public'.
          if (story.audience === 'only_me') {
            userGroup.highestPriorityAudience = 'only_me';
          } else if (story.audience === 'friends' && userGroup.highestPriorityAudience !== 'only_me') {
            userGroup.highestPriorityAudience = 'friends';
          }
        }
      });

      // Convert to array and sort: current user first, then users with unviewed stories, then others
      const groupedArray = Array.from(userMap.values()).sort((a, b) => {
        if (a.user._id === currentUserId) return -1;
        if (b.user._id === currentUserId) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0; // maintain relative order
      });
      
      state.groupedStories = groupedArray;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = action.payload;
        // Grouping is usually dispatched right after fetch, or done here if we have currentUserId.
        // We'll dispatch groupStories from the component so we have access to current user ID.
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStory.fulfilled, (state, action) => {
        state.stories.unshift(action.payload);
      })
      .addCase(markStoryViewed.fulfilled, (state, action) => {
        const { storyId } = action.payload;
        // The current user ID isn't directly available in action payload unless we pass it.
        // For simplicity, we just trigger a re-fetch of stories from the UI, or we can update local state.
        // But we need the current user ID to add to viewedBy.
        // We will handle local state update in the component or via another action.
      });
  },
});

export const { groupStories } = storySlice.actions;
export default storySlice.reducer;
