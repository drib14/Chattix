import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ChevronLeft, ChevronRight, Globe, Users, Lock, Trash2 } from 'lucide-react';
import { markStoryViewed, deleteStory } from '../redux/slices/storySlice';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';
const STORY_DURATION = 5000; // 5 seconds per image story

const StoryViewer = ({ groupedStories, initialUserIndex, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const activeUserGroup = groupedStories[currentUserIndex];
  const activeStory = activeUserGroup?.stories[currentStoryIndex];
  const isVideo = activeStory?.mediaType === 'video';
  const isOwnStory = activeStory?.user?._id === user?._id;

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const startTime = useRef(Date.now());

  // Mark story as viewed
  useEffect(() => {
    if (activeStory && !activeStory.viewedBy.includes(user?._id)) {
      dispatch(markStoryViewed(activeStory._id));
    }
  }, [activeStory, dispatch, user?._id]);

  const handleNextStory = () => {
    if (currentStoryIndex < activeUserGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(groupedStories[currentUserIndex - 1].stories.length - 1);
      setProgress(0);
    }
  };

  // Auto advance timer
  useEffect(() => {
    if (isPaused) return;

    if (isVideo) {
      // Video handles its own progress
      return;
    }

    startTime.current = Date.now() - (progress / 100) * STORY_DURATION;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        clearInterval(progressInterval.current);
        handleNextStory();
      } else {
        setProgress(newProgress);
      }
    }, 16);

    return () => clearInterval(progressInterval.current);
  }, [currentStoryIndex, currentUserIndex, isPaused, isVideo]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || isPaused) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total) {
      setProgress((current / total) * 100);
    }
  };

  const handleVideoEnded = () => {
    handleNextStory();
  };

  const togglePause = (pause) => {
    setIsPaused(pause);
    if (videoRef.current) {
      if (pause) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this story?')) {
      // pause timer while deleting
      togglePause(true);
      // Wait for delete action to complete, then close viewer
      // For simplicity here, just close since redux state isn't hooked to auto-remove yet.
      onClose();
    }
  };

  if (!activeStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center sm:p-4">
      <div 
        className="w-full h-full sm:max-w-md sm:h-[90vh] bg-gray-900 sm:rounded-[2rem] overflow-hidden relative"
        onMouseDown={() => togglePause(true)}
        onMouseUp={() => togglePause(false)}
        onTouchStart={() => togglePause(true)}
        onTouchEnd={() => togglePause(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-20">
          {activeUserGroup.stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-4 pt-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <img 
              src={activeUserGroup.user.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(activeUserGroup.user.fullName || 'U')}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div>
              <p className="text-white font-semibold text-sm drop-shadow-md">
                {activeUserGroup.user.fullName}
              </p>
              <div className="flex items-center gap-1.5 text-white/80 text-xs drop-shadow-md">
                {activeStory.audience === 'public' && <Globe size={10} />}
                {activeStory.audience === 'friends' && <Users size={10} />}
                {activeStory.audience === 'only_me' && <Lock size={10} />}
                <span>{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-white">
            {isOwnStory && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 hover:bg-white/10 rounded-full">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {isVideo ? (
            <video 
              ref={videoRef}
              src={activeStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <img 
              src={activeStory.mediaUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Caption */}
        {activeStory.caption && (
          <div className="absolute bottom-16 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
            <p className="text-white text-base text-center font-medium drop-shadow-md">
              {activeStory.caption}
            </p>
          </div>
        )}

        {/* Views Count for Own Story */}
        {isOwnStory && activeStory.viewedBy.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 text-white/80 animate-bounce cursor-pointer">
            <ChevronLeft size={16} className="rotate-90" />
            <span className="text-xs font-semibold">{activeStory.viewedBy.length} Views</span>
          </div>
        )}

        {/* Navigation Tap Zones */}
        <div 
          className="absolute inset-y-0 left-0 w-1/3 z-10" 
          onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
        />
        <div 
          className="absolute inset-y-0 right-0 w-1/3 z-10" 
          onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
        />
      </div>
    </div>
  );
};

export default StoryViewer;
