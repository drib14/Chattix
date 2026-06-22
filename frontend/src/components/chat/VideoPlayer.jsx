import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const VideoPlayer = ({ src, className = '', style = {} }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeekChange = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '160px',
        background: '#000',
        borderRadius: isFullscreen ? '0px' : '16px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: showControls ? 'default' : 'none',
        boxShadow: 'var(--clay-shadow-inset)',
        border: '1.5px solid rgba(255,255,255,0.2)',
        ...style,
      }}
      className={className}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: isFullscreen ? '100vh' : '70vh',
          objectFit: 'contain',
        }}
      />

      {/* Play/Pause Center Overlay (Claymorphic Style) */}
      {(!isPlaying || showControls) && (
        <div
          style={{
            position: 'absolute',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            padding: '16px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isPlaying ? 'scale(0.8)' : 'scale(1)',
            opacity: isPlaying ? 0.8 : 1,
            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15)'
          }}
        >
          {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
        </div>
      )}

      {/* Custom Bottom Control Bar */}
      {showControls && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10,
          }}
        >
          {/* Progress Seek Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              style={{
                flex: 1,
                height: '4px',
                accentColor: 'var(--clay-primary)',
                borderRadius: '2px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.3)',
              }}
            />
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold' }}>{formatTime(duration)}</span>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Play Pause */}
              <button
                type="button"
                onClick={togglePlay}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
              </button>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={toggleMute}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '60px',
                    height: '3px',
                    accentColor: 'white',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
