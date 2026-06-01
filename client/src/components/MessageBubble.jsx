import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CornerUpLeft,
  Pin,
  Trash,
  FileText,
  Play,
  Pause,
  Download,
  CheckCheck,
  Smile,
  Phone,
  PhoneOff,
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
  Info,
  X,
  Maximize2
} from 'lucide-react';

export default function MessageBubble({ message, index, messages, onReply }) {
  const { user, deleteMessage, togglePin, sendReaction, showToast, votePoll, currentChat } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Reaction picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Lightbox preview for media
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Setup Audio Node if message type is voice
  useEffect(() => {
    if (message.messageType === 'voice' && message.fileUrl) {
      const audio = new Audio(message.fileUrl);
      audioRef.current = audio;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration || 0);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
      };
    }
  }, [message]);

  // Audio actions
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleAudioScrub = (e) => {
    if (!audioRef.current || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSeconds = (sec) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSender = message?.sender?._id === user?.id;

  // Custom call history log entry formatting
  if (message.messageType === 'call') {
    const isMissed = message.content.toLowerCase().includes('missed') || 
                     message.content.toLowerCase().includes('no answer') || 
                     message.content.toLowerCase().includes('declined') ||
                     message.content.toLowerCase().includes('missed call');
                     
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        margin: '16px 0',
        animation: 'fadeIn 0.25s ease-out'
      }}>
        <div className="glass-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '24px',
          background: isMissed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: isMissed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(15px)',
          transition: 'all 0.2s',
          cursor: 'default'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.background = isMissed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = isMissed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)';
        }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isMissed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isMissed ? '#f87171' : '#34d399',
            boxShadow: isMissed ? '0 0 10px rgba(239, 68, 68, 0.2)' : '0 0 10px rgba(16, 185, 129, 0.2)'
          }}>
            {isMissed ? <PhoneOff size={14} /> : <Phone size={14} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{
              fontSize: '12px',
              color: 'white',
              fontWeight: '600',
              letterSpacing: '-0.1px'
            }}>
              {isMissed ? 'Missed Call' : 'Call Log'}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontWeight: '400'
            }}>
              {message.content}
            </span>
          </div>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginLeft: '4px',
            alignSelf: 'flex-end',
            marginBottom: '1px'
          }}>
            • {formatMessageTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // Context-aware cluster borders & spacing calculations (Facebook Messenger replication)
  const prevMsg = index > 0 ? messages[index - 1] : null;
  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

  const isPrevSameSender = prevMsg && prevMsg.sender._id === message.sender._id && prevMsg.messageType !== 'poll' && message.messageType !== 'poll' && !prevMsg.isDeleted;
  const isNextSameSender = nextMsg && nextMsg.sender._id === message.sender._id && nextMsg.messageType !== 'poll' && message.messageType !== 'poll' && !nextMsg.isDeleted;

  const getBubbleRadius = () => {
    if (message.messageType === 'poll') return '12px'; // Polls are block layout

    if (isSender) {
      if (isPrevSameSender && isNextSameSender) return '18px 4px 4px 18px';
      if (isPrevSameSender) return '18px 4px 18px 18px';
      if (isNextSameSender) return '18px 18px 4px 18px';
      return '18px 18px 18px 18px';
    } else {
      if (isPrevSameSender && isNextSameSender) return '4px 18px 18px 4px';
      if (isPrevSameSender) return '4px 18px 18px 18px';
      if (isNextSameSender) return '18px 18px 18px 4px';
      return '18px 18px 18px 18px';
    }
  };

  const getThemeGradient = (colorName) => {
    switch (colorName) {
      case 'blue':
        return 'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)';
      case 'pink':
        return 'linear-gradient(135deg, #ff007f 0%, #ff80df 100%)';
      case 'orange':
        return 'linear-gradient(135deg, #ff5e36 0%, #ffaa00 100%)';
      case 'green':
        return 'linear-gradient(135deg, #00b060 0%, #00e0a0 100%)';
      case 'purple':
      default:
        return 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)';
    }
  };

  const bubbleStyle = {
    margin: 0,
    borderRadius: getBubbleRadius()
  };

  if (message.isDeleted) {
    bubbleStyle.background = 'transparent';
    bubbleStyle.border = '1px dashed rgba(255, 255, 255, 0.2)';
    bubbleStyle.boxShadow = 'none';
    bubbleStyle.padding = '8px 14px';
  } else if (message.messageType === 'sticker') {
    bubbleStyle.background = 'transparent';
    bubbleStyle.border = 'none';
    bubbleStyle.boxShadow = 'none';
    bubbleStyle.padding = '0';
  } else if (isSender && message.messageType !== 'poll') {
    bubbleStyle.background = getThemeGradient(currentChat?.themeColor);
  }

  // Render attachment helper
  const renderAttachment = () => {
    if (!message.fileUrl) return null;

    switch (message.messageType) {
      case 'sticker':
        return (
          <div
            className="sticker-bubble-container"
            style={{
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              cursor: 'pointer',
              padding: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src={message.fileUrl}
              alt="sticker"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                display: 'block',
                background: 'transparent'
              }}
            />
          </div>
        );
      case 'image':
        return (
          <div
            className="attachment-preview-container"
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              border: '1.5px solid var(--glass-border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              maxWidth: '320px',
              width: '100%',
              height: '200px',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              background: '#0a0a0f'
            }}
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(168, 85, 247, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
            }}
          >
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Image attachment'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {/* Visual background bounds hover overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              opacity: 0,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '12px'
            }}
            className="hover-overlay"
            >
              <span style={{ fontSize: '11px', color: 'white', fontWeight: '500' }}>Click to expand</span>
              <Maximize2 size={14} color="white" />
            </div>
          </div>
        );
      case 'video':
        return (
          <div
            className="attachment-preview-container"
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              border: '1.5px solid var(--glass-border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              maxWidth: '320px',
              width: '100%',
              height: '200px',
              background: '#000'
            }}
            onClick={() => setLightboxOpen(true)}
          >
            <video
              src={message.fileUrl}
              muted
              autoPlay
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {/* Custom play icon and title overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            className="video-overlay"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              className="play-btn"
              >
                <Play size={20} fill="white" style={{ marginLeft: '3px' }} />
              </div>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="audio-voice-player">
            <button
              type="button"
              className="icon-btn"
              onClick={togglePlay}
              style={{
                background: isSender ? 'rgba(255,255,255,0.2)' : 'rgba(168,85,247,0.1)',
                color: isSender ? 'white' : 'var(--accent-purple)',
                width: '28px',
                height: '28px',
                borderRadius: '50%'
              }}
            >
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" style={{ marginLeft: '1px' }} />}
            </button>
            <div
              ref={progressRef}
              className="audio-progress"
              onClick={handleAudioScrub}
            >
              <div
                className="audio-progress-fill"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <span style={{ fontSize: '10px', minWidth: '30px', color: isSender ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
              {formatSeconds(isPlaying ? currentTime : duration)}
            </span>
          </div>
        );
      case 'file':
      default:
        return (
          <a
            className="attachment-file-box"
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={message.fileName}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: isSender ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px',
              borderRadius: '12px',
              transition: 'all 0.2s',
              minWidth: '220px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isSender ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isSender ? 'rgba(0,0,0,0.15)' : 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <div className="file-box-icon" style={{
              background: 'rgba(168, 85, 247, 0.15)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <FileText size={20} />
            </div>
            <div className="file-box-info" style={{ flex: 1, overflow: 'hidden' }}>
              <div className="file-box-name" style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                {message.fileName || 'Attachment'}
              </div>
              <div className="file-box-size" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Document'}
              </div>
            </div>
            <div className="icon-btn" style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Download size={14} />
            </div>
          </a>
        );
    }
  };

  return (
    <div className={`message-wrapper ${isSender ? 'sender' : 'receiver'}`} style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', marginTop: !isPrevSameSender ? '12px' : '2px' }}>
      
      {/* Show Sender Name only at the start of a clustered group of receiver messages */}
      {!isSender && !isPrevSameSender && (
        <span className="message-sender-name" style={{ alignSelf: 'flex-start', margin: '0 0 0 36px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
          {message.sender?.username || 'Chattix User'}
        </span>
      )}

      <div style={{ display: 'flex', flexDirection: isSender ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
        {/* Render Profile Photo - Hidden if next message is from the same sender (Messenger clustered styling) */}
        <div className="avatar-wrapper" style={{ width: '28px', height: '28px', flexShrink: 0, marginBottom: '2px', visibility: isNextSameSender ? 'hidden' : 'visible' }}>
          {message.sender?.profilePhoto ? (
            <img className="avatar" src={message.sender.profilePhoto} alt={message.sender.username} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="avatar-placeholder" style={{ fontSize: '10px', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(message.sender?.username || 'CU').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSender ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
          {/* RENDER INLINE REPLIES / QUOTED PREVIEWS */}
          {message.parentMessage && (
            <div
              className="quoted-message-preview"
              style={{ alignSelf: isSender ? 'flex-end' : 'flex-start', marginBottom: '4px' }}
            >
              <div className="quoted-message-sender">
                @{message.parentMessage.sender?.username || 'user'}
              </div>
              <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {message.parentMessage.isDeleted ? 'This message was deleted.' : message.parentMessage.content || 'Attached file'}
              </div>
            </div>
          )}

          {/* BUBBLE FEED CONTAINER */}
          <div className="message-bubble" style={bubbleStyle}>
            {message.isDeleted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                <Shield size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  This message was unsent.
                </p>
              </div>
            ) : (
              <>
                {/* Render media if any */}
                {renderAttachment()}

                {/* Render group poll if type is poll */}
                {message.messageType === 'poll' && message.pollDetails && (
                  <div style={{ padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)', fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px' }}>📊 Group Poll</span>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'white', margin: '2px 0 4px 0' }}>{message.pollDetails.question}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {message.pollDetails.options.map((opt, idx) => {
                        const totalVotes = message.pollDetails.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                        const hasVoted = opt.votes?.some(vId => vId.toString() === user.id);
                        const votesCount = opt.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (message.isDeleted) return;
                              votePoll(currentChat._id, message._id, idx);
                            }}
                            style={{
                              position: 'relative',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.03)',
                              border: hasVoted ? '1px solid rgba(168,85,247,0.4)' : '1px solid var(--glass-border)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              overflow: 'hidden',
                              transition: 'all 0.15s ease-out',
                              userSelect: 'none'
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${percentage}%`,
                                background: hasVoted ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)',
                                zIndex: 0,
                                transition: 'width 0.3s ease-out'
                              }}
                            ></div>
                            <span style={{ zIndex: 1, fontSize: '12px', fontWeight: hasVoted ? '600' : 'normal' }}>{opt.optionText}</span>
                            <span style={{ zIndex: 1, fontSize: '10.5px', color: 'var(--text-muted)' }}>{votesCount} votes ({percentage}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Text message */}
                {message.content && message.messageType !== 'sticker' && message.messageType !== 'image' && message.messageType !== 'video' && message.messageType !== 'file' && (
                  <p style={{ margin: 0, fontSize: '13.5px' }}>{message.content}</p>
                )}
                
                {/* Sticker message */}
                {message.messageType === 'sticker' && (
                  <div className="sticker-container" style={{ display: 'flex', userSelect: 'none' }}>
                    {message.content && (message.content.startsWith('http://') || message.content.startsWith('https://')) ? (
                      <img
                        src={message.content}
                        alt="Sticker"
                        style={{
                          maxWidth: '120px',
                          maxHeight: '120px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ) : (
                      <span style={{ fontSize: '70px', lineHeight: 1 }}>{message.content}</span>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="message-bubble-meta">
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.isEdited && !message.isDeleted && <span style={{ fontStyle: 'italic' }}>(edited)</span>}
              {isSender && (
                <span style={{ color: 'var(--accent-cyan)' }}>
                  <CheckCheck size={11} />
                </span>
              )}
            </div>

            {/* Message Actions options on hover */}
            {!message.isDeleted && (
              <div className="message-bubble-options">
                <button className="bubble-option-btn" title="Reply Message" onClick={onReply}>
                  <CornerUpLeft size={12} />
                </button>
                <button className="bubble-option-btn" title="Pin Message" onClick={() => togglePin(message._id)}>
                  <Pin size={12} />
                </button>
                {isSender && (
                  <button className="bubble-option-btn" title="Delete for Everyone" onClick={() => deleteMessage(message._id)}>
                    <Trash size={12} />
                  </button>
                )}
                <button className="bubble-option-btn" title="React Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile size={12} />
                </button>

                {/* Quick reaction picker shelf */}
                {showEmojiPicker && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '30px',
                      left: isSender ? 'auto' : '30px',
                      right: isSender ? '30px' : 'auto',
                      padding: '4px',
                      display: 'flex',
                      gap: '4px',
                      zIndex: 30,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}
                  >
                    {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        style={{ background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer', padding: '2px' }}
                        onClick={() => {
                          sendReaction(message._id, emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render emoji reactions list under bubble */}
      {message.reactions && message.reactions.length > 0 && !message.isDeleted && (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginTop: '2px',
            alignSelf: isSender ? 'flex-end' : 'flex-start',
            marginRight: isSender ? '36px' : '0',
            marginLeft: isSender ? '0' : '36px'
          }}
        >
          {message.reactions.map((r, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '2px 4px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>{r.emoji}</span>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX PREVIEW OVERLAY PORTAL */}
      {lightboxOpen && message.fileUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 5, 8, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          {/* Lightbox header/actions */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '12px',
            zIndex: 10000
          }}>
            <a
              href={message.fileUrl}
              download={message.fileName || 'chattix_media'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              title="Download Media File"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>

          {/* Lightbox body */}
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '75vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {message.messageType === 'video' ? (
              <video
                src={message.fileUrl}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}
              />
            ) : (
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Media preview'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}
              />
            )}
          </div>

          {/* Info text footer */}
          <div style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
            <span style={{ fontWeight: '600', color: 'white' }}>{message.fileName || 'Media attachment'}</span>
            <span>Sent by @{message.sender?.username || 'user'} • {formatMessageTime(message.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
