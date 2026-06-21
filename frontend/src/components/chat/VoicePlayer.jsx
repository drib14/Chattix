import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const VoicePlayer = ({ src, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const handleSliderChange = (e) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      style={{
        ...styles.container,
        background: isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f8fafc',
        borderColor: isOwn ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
      }}
    >
      <audio ref={audioRef} src={src} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      
      {/* Dynamic Clay-style Play Control */}
      <button
        onClick={togglePlay}
        style={{
          ...styles.playBtn,
          background: isOwn ? '#ffffff' : 'var(--clay-primary)',
          color: isOwn ? 'var(--clay-primary)' : '#ffffff',
        }}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>

      {/* Progress Track Slider */}
      <div style={styles.trackWrapper}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSliderChange}
          style={{
            ...styles.slider,
            accentColor: isOwn ? '#ffffff' : 'var(--clay-primary)',
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={styles.timeRow}>
          <span style={isOwn ? styles.timeOwn : styles.timeOther}>{formatTime(currentTime)}</span>
          <span style={isOwn ? styles.timeOwn : styles.timeOther}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '16px',
    border: '1.5px solid',
    width: '240px',
    maxWidth: '100%',
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)',
  },
  playBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.15s',
  },
  trackWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    fontWeight: 700,
  },
  timeOwn: {
    color: '#e0e7ff',
  },
  timeOther: {
    color: 'var(--text-secondary)',
  },
};

export default VoicePlayer;
