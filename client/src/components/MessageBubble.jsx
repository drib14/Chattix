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
  Smile
} from 'lucide-react';

export default function MessageBubble({ message, index, messages, onReply }) {
  const { user, deleteMessage, togglePin, sendReaction, showToast, votePoll, currentChat } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Reaction picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  if (message.messageType === 'call') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '12px 0',
        width: '100%',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '6px 16px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(5px)'
        }}>
          <span>📞</span>
          <span style={{ fontWeight: '500' }}>{message.content || 'Call finished'}</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>{formatMessageTime(message.createdAt)}</span>
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

  if (message.messageType === 'sticker') {
    bubbleStyle.background = 'transparent';
    bubbleStyle.border = 'none';
    bubbleStyle.boxShadow = 'none';
    bubbleStyle.padding = '0';
  } else if (isSender && message.messageType !== 'poll' && !message.isDeleted) {
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
          <div className="attachment-preview-container">
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
              <img className="attachment-image" src={message.fileUrl} alt={message.fileName || 'Image attachment'} />
            </a>
          </div>
        );
      case 'video':
        return (
          <div className="attachment-preview-container" style={{ maxWidth: '280px', maxHeight: 'none' }}>
            <video
              src={message.fileUrl}
              controls
              style={{ width: '100%', borderRadius: '8px', display: 'block', maxHeight: '180px' }}
            />
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
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
          >
            <div className="file-box-icon">
              <FileText size={18} />
            </div>
            <div className="file-box-info">
              <div className="file-box-name">{message.fileName || 'Attachment'}</div>
              <div className="file-box-size">
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Document'}
              </div>
            </div>
            <div className="icon-btn" style={{ width: '24px', height: '24px' }}>
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
            {message.content && !message.isDeleted && (
              <p style={{ margin: 0, fontSize: '13.5px' }}>{message.content}</p>
            )}
            {message.isDeleted && (
              <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', opacity: 0.6 }}>
                {message.content}
              </p>
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
      {message.reactions && message.reactions.length > 0 && (
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
    </div>
  );
}
