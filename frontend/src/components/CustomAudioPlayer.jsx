import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const CustomAudioPlayer = ({ src, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    // If already loaded
    if (audio.readyState >= 1) {
      setAudioData();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const seekTime = (clickPos / rect.width) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 w-full select-none ${isOwn ? 'text-white' : 'text-gray-800'}`}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      
      <button 
        type="button" 
        onClick={togglePlayPause} 
        className={`p-2.5 rounded-full shrink-0 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${isOwn ? 'bg-white text-chattix-primary shadow-sm' : 'bg-chattix-primary text-white shadow-sm'}`}
      >
        {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <div 
          className="h-1.5 w-full rounded-full cursor-pointer relative group flex items-center"
          style={{ backgroundColor: isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}
          onClick={handleSeek}
        >
          <div 
            className="absolute left-0 h-full rounded-full transition-all duration-100 ease-linear pointer-events-none"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isOwn ? '#ffffff' : '#3B82F6'
            }}
          >
            {/* Playhead dot */}
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 shadow-sm ${isOwn ? 'bg-white' : 'bg-chattix-primary'}`} />
          </div>
        </div>
        <div className={`flex justify-between text-[10px] font-medium tracking-wide ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
