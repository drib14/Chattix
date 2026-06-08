import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Globe, Users, Lock } from 'lucide-react';
import { fetchStories, groupStories } from '../redux/slices/storySlice';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import { t } from '../utils/translations';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const StoryTray = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { groupedStories, loading } = useSelector((state) => state.story);
  const { onlineUsers } = useSelector((state) => state.chat);
  const { language } = useSelector((state) => state.theme);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchStories()).then(() => {
      if (user) {
        dispatch(groupStories(user._id));
      }
    });
  }, [dispatch, user]);

  const handleStoryClick = (index) => {
    setSelectedUserIndex(index);
    setViewerOpen(true);
  };

  const getBorderClass = (hasUnviewed, audience, isCurrentUser) => {
    if (!hasUnviewed) return 'border-gray-300';
    if (audience === 'public') return 'border-transparent bg-gradient-to-tr from-blue-400 to-indigo-600';
    if (audience === 'friends') return 'border-blue-500';
    if (audience === 'only_me') return 'border-green-400';
    return 'border-gray-300';
  };

  return (
    <>
      <div className="w-full bg-white border-b border-gray-100 py-3 px-2 overflow-x-auto hide-scrollbar flex items-center gap-4 shrink-0">
        
        {/* Add Story Button (Always first) */}
        <div className="flex flex-col items-center gap-1 shrink-0 w-16" onClick={() => setCreatorOpen(true)}>
          <div className="relative cursor-pointer">
            <div className="w-14 h-14 rounded-full p-[2px] border-2 border-transparent">
              <img 
                src={user?.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(user?.fullName || 'U')}`} 
                alt="Your Story" 
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </div>
            <div className="absolute bottom-1 right-0 bg-chattix-primary text-white rounded-full p-0.5 border-2 border-white">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>
          <p className="text-xs text-gray-800 font-medium truncate w-full text-center">Your Story</p>
        </div>

        {/* Story Items */}
        {groupedStories.map((group, index) => {
          const isCurrentUser = group.user._id === user?._id;
          const isOnline = onlineUsers.some(u => {
            const uid = typeof u === 'object' && u !== null ? u.userId : u;
            return uid?.toString() === group.user._id?.toString();
          });
          const borderClass = getBorderClass(group.hasUnviewed, group.highestPriorityAudience, isCurrentUser);
          
          return (
            <div 
              key={group.user._id} 
              className="flex flex-col items-center gap-1 shrink-0 w-16 cursor-pointer"
              onClick={() => handleStoryClick(index)}
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full p-[2px] ${borderClass.includes('bg-gradient') ? borderClass + ' bg-origin-border' : 'border-2 ' + borderClass}`}>
                  <img 
                    src={group.user.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(group.user.fullName || 'U')}`} 
                    alt={group.user.fullName} 
                    className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                  />
                </div>
                {/* Online Indicator */}
                {isOnline && !isCurrentUser && (
                  <div className="absolute bottom-1 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <p className="text-xs text-gray-800 font-medium truncate w-full text-center">
                {isCurrentUser ? 'You' : group.user.fullName.split(' ')[0]}
              </p>
              <p className="text-[9px] text-gray-400 truncate w-full text-center -mt-1">
                @{group.user.username}
              </p>
            </div>
          );
        })}

        {!loading && groupedStories.length === 0 && (
          <div className="text-xs text-gray-400 italic px-4 flex items-center justify-center h-14">
            No recent stories
          </div>
        )}
      </div>

      {creatorOpen && (
        <StoryCreator onClose={() => setCreatorOpen(false)} />
      )}

      {viewerOpen && groupedStories.length > 0 && (
        <StoryViewer 
          groupedStories={groupedStories} 
          initialUserIndex={selectedUserIndex} 
          onClose={() => setViewerOpen(false)} 
        />
      )}
    </>
  );
};

export default StoryTray;
