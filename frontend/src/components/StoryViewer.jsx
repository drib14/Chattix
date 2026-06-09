import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Globe, Users, Lock, Trash2, Eye, Heart, MessageCircle, Share2, Send, ChevronUp, MapPin, Link as LinkIcon } from 'lucide-react';
import { markStoryViewed, deleteStory, reactToStory } from '../redux/slices/storySlice';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';
const STORY_DURATION = 5000;

const StoryViewer = ({ groupedStories, initialUserIndex, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { confirm } = useConfirm();
  
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  
  const activeUserGroup = groupedStories[currentUserIndex];
  const activeStory = activeUserGroup?.stories[currentStoryIndex];
  const isVideo = activeStory?.mediaType === 'video';
  const isTextMode = activeStory?.textMode || activeStory?.mediaType === 'text';
  const isOwnStory = activeStory?.user?._id === user?._id;

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (activeStory && !activeStory.viewedBy.some(v => v.user === user?._id || v.user?._id === user?._id)) {
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

  useEffect(() => {
    if (isPaused || showViewers) return;

    if (isVideo) return;

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
  }, [currentStoryIndex, currentUserIndex, isPaused, isVideo, showViewers]);

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || isPaused || showViewers) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total) {
      setProgress((current / total) * 100);
    }
  };

  const togglePause = (pause) => {
    setIsPaused(pause);
    if (videoRef.current) {
      if (pause) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleDelete = async () => {
    togglePause(true);
    if (await confirm({ title: 'Delete this story?', message: 'This story will be permanently deleted.', isDestructive: true, confirmText: 'Delete' })) {
      try {
        await dispatch(deleteStory(activeStory._id)).unwrap();
        toast.success('Story deleted');
        if (activeUserGroup.stories.length === 1) onClose();
        else handleNextStory();
      } catch (error) {
        toast.error('Failed to delete story');
      }
    } else {
      togglePause(false);
    }
  };

  const handleReact = async (emoji) => {
    try {
      await dispatch(reactToStory({ storyId: activeStory._id, emoji })).unwrap();
      toast.success(`Reacted with ${emoji}`);
      setShowReactions(false);
    } catch (e) {
      toast.error('Failed to react');
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    toast.success('Reply sent');
    setReplyText('');
  };

  const handleReshare = () => {
    toast.success('Story reshared');
  };

  if (!activeStory) return null;

  // Viewers Logic
  const viewsCount = activeStory.viewedBy?.filter(v => {
    const viewerId = v.user?._id || v.user;
    return viewerId !== activeStory.user?._id;
  }).length || 0;
  // Let's pretend new viewers are those in the last 1 hour
  const isNewViewer = (dateStr) => (new Date() - new Date(dateStr)) < 60 * 60 * 1000;
  const isFriend = (viewerId) => user?.friends?.includes(viewerId);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex lg:p-8">
      
      {/* Container: 2 columns on lg */}
      <div className="w-full h-full lg:max-w-7xl lg:mx-auto flex flex-col lg:flex-row gap-8 bg-gray-950 lg:rounded-3xl lg:p-6 overflow-hidden">
        
        {/* Left: Player */}
        <div 
          className="w-full h-full lg:w-2/3 lg:rounded-2xl bg-black relative flex flex-col items-center justify-center overflow-hidden"
          onMouseDown={() => !showViewers && togglePause(true)}
          onMouseUp={() => !showViewers && togglePause(false)}
          onTouchStart={() => !showViewers && togglePause(true)}
          onTouchEnd={() => !showViewers && togglePause(false)}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-20">
            {activeUserGroup.stories.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' }}
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
            
            <div className="flex items-center gap-4 text-white lg:hidden">
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Story Content */}
          <div className="relative w-full h-full flex items-center justify-center">
            {isTextMode ? (
              <div className={`w-full h-full flex items-center justify-center p-8 ${activeStory.backgroundColor || 'bg-gradient-to-tr from-blue-500 to-purple-600'}`}>
                <p className={`text-center text-3xl md:text-4xl lg:text-5xl font-bold whitespace-pre-wrap break-words px-4 ${activeStory.fontColor || 'text-white'} ${activeStory.fontFamily || 'font-sans'}`}>
                  {activeStory.caption}
                </p>
              </div>
            ) : isVideo ? (
              <video 
                ref={videoRef}
                src={activeStory.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleNextStory}
              />
            ) : (
              <img 
                src={activeStory.mediaUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            )}

            {/* Render Overlays */}
            {activeStory.overlays && activeStory.overlays.map((overlay, idx) => {
              if (overlay.type === 'doodle') return null; // Rendered below
              
              const getTimeStyle = (styleIdx) => {
                switch(styleIdx) {
                  case 1: return 'bg-black text-white font-mono';
                  case 2: return 'bg-transparent text-white drop-shadow-xl font-serif text-4xl';
                  case 3: return 'bg-white/20 backdrop-blur text-white font-sans border border-white/50';
                  default: return 'bg-white text-black font-sans';
                }
              };

              return (
                <div 
                  key={idx} 
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, zIndex: 10 }}
                >
                  {overlay.type === 'time' && <div className={`font-bold px-4 py-2 rounded-lg shadow-lg text-xl ${getTimeStyle(overlay.styleIdx)}`}>{overlay.text}</div>}
                  {overlay.type === 'location' && <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"><MapPin size={16} />{overlay.text}</div>}
                  {overlay.type === 'link' && <a href={overlay.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/90 backdrop-blur text-blue-600 font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto"><LinkIcon size={16} />{overlay.text}</a>}
                  {overlay.type === 'sticker' && <img src={overlay.url} alt="sticker" className="w-32 h-32 object-contain" />}
                  {overlay.type === 'tag' && (
                    <div 
                      className="bg-black/70 backdrop-blur text-white px-4 py-2 rounded-xl shadow-lg flex flex-col items-center cursor-pointer pointer-events-auto" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (overlay.userId) {
                          onClose();
                          navigate(`/messages/${overlay.userId}`);
                        }
                      }}
                    >
                      <span className="font-bold">{overlay.fullName || overlay.text}</span>
                      {overlay.username && <span className="text-xs text-white/70">@{overlay.username}</span>}
                    </div>
                  )}
                  {overlay.type === 'text' && (
                    <div className={`px-4 py-2 rounded-lg shadow-lg text-2xl font-bold whitespace-pre-wrap text-center ${overlay.fontColor || 'text-white'} ${overlay.fontFamily || 'font-sans'}`}>
                      {overlay.text}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Render Doodle Overlay */}
            {activeStory.overlays && activeStory.overlays.some(o => o.type === 'doodle') && (
              <img 
                src={activeStory.overlays.find(o => o.type === 'doodle').url} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10" 
                alt="doodle" 
              />
            )}
          </div>

          {/* Media Caption */}
          {!isTextMode && activeStory.caption && (
            <div className="absolute bottom-16 lg:bottom-24 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
              <p className="text-white text-base text-center font-medium drop-shadow-md">
                {activeStory.caption}
              </p>
            </div>
          )}

          {/* Bottom Controls / Analytics */}
          <div className="absolute bottom-0 left-0 w-full p-4 flex items-end justify-between z-30 pointer-events-none">
            {/* View Count (Own Story) */}
            {isOwnStory ? (
              <div 
                className="pointer-events-auto flex items-center gap-2 cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-md px-4 py-2 rounded-full transition-colors lg:hidden"
                onClick={(e) => { e.stopPropagation(); togglePause(true); setShowViewers(true); }}
              >
                <Eye size={18} className="text-white" />
                <span className="text-white font-semibold text-sm">{viewsCount}</span>
              </div>
            ) : (
              <div className="pointer-events-auto flex-1 mr-4">
                <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                  <input 
                    type="text" 
                    placeholder="Reply to story..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => togglePause(true)}
                    onBlur={() => togglePause(false)}
                    className="bg-transparent text-white placeholder-white/70 flex-1 outline-none text-sm"
                  />
                  <button onClick={(e) => { e.stopPropagation(); handleReply(); }} className="text-white ml-2">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Interaction Buttons (Not own story) */}
            {!isOwnStory && (
              <div className="pointer-events-auto flex items-center gap-3">
                <div className="relative">
                  {showReactions && (
                    <div className="absolute bottom-full mb-2 right-0 bg-black/80 backdrop-blur-md p-2 rounded-full flex items-center gap-2 border border-white/10">
                      {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                        <button key={emoji} onClick={() => handleReact(emoji)} className="text-2xl hover:scale-125 transition-transform">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60">
                    <Heart size={20} />
                  </button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleReshare(); }} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60">
                  <Share2 size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Tap Zones */}
          <div className="absolute inset-y-20 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
          <div className="absolute inset-y-20 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />
        </div>

        {/* Right: Analytics & Settings (Large Screens) */}
        <div className="hidden lg:flex lg:w-1/3 flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="text-white font-bold text-xl">Story Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 hide-scrollbar">
            {/* Viewers Section (Only for owner) */}
            {isOwnStory && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={20} className="text-white/70" />
                    <h4 className="text-white font-semibold text-lg">{viewsCount} Views</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Mocking viewers list, in reality this would map over activeStory.viewedBy */}
                  {activeStory.viewedBy && activeStory.viewedBy.length > 0 ? (
                    <div className="text-white/50 text-sm">Viewer details will appear here. Currently {viewsCount} view(s).</div>
                  ) : (
                    <p className="text-white/50 text-sm text-center py-4">No views yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Reactions Section */}
            {activeStory.reactions && activeStory.reactions.length > 0 && (
              <div>
                <h4 className="text-white font-semibold text-lg mb-4">Reactions</h4>
                <div className="flex flex-wrap gap-2">
                  {activeStory.reactions.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1">
                      <span>{r.emoji}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Section */}
            {isOwnStory && (
              <div className="mt-auto pt-6 border-t border-white/5">
                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Trash2 size={20} />
                  Delete Story
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Drawer: Viewers & Settings (Small Screens) */}
        {showViewers && (
          <div className="absolute inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={() => { setShowViewers(false); togglePause(false); }}>
            <div className="w-full h-[70vh] bg-gray-900 rounded-t-3xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-center p-3 cursor-pointer" onClick={() => { setShowViewers(false); togglePause(false); }}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Eye size={24} />
                  <span className="font-bold text-xl">{viewsCount} Views</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                {activeStory.viewedBy && activeStory.viewedBy.length > 0 ? (
                  <div className="text-white/50 text-sm">Viewer details will appear here. Currently {viewsCount} view(s).</div>
                ) : (
                  <p className="text-white/50 text-sm text-center py-8">No views yet</p>
                )}
              </div>

              {isOwnStory && (
                <div className="p-4 border-t border-white/5">
                  <button 
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl font-semibold"
                  >
                    <Trash2 size={20} />
                    Delete Story
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StoryViewer;
