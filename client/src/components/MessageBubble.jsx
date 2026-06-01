import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CornerUpLeft,
  Pin,
  Trash,
  Globe,
  FileText,
  Play,
  Pause,
  Download,
  Check,
  CheckCheck,
  Smile
} from 'lucide-react';

export default function MessageBubble({ message, onReply }) {
  const { user, deleteMessage, togglePin, translateMessageAPI, sendReaction, showToast, onlineUsers } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Translation states
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [translationLang, setTranslationLang] = useState('');
  const [translating, setTranslating] = useState(false);

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

  // Translate click
  const handleTranslate = async (langName) => {
    setShowLangDropdown(false);
    if (!message.content) return;

    setTranslating(true);
    showToast(`AI is translating message to ${langName}...`, 'info');
    const res = await translateMessageAPI(message.content, langName);
    setTranslating(false);

    if (res.success) {
      setTranslationText(res.translatedText);
      setTranslationLang(langName);
      showToast('Translation completed!', 'success');
    } else {
      showToast(res.message, 'error');
    }
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

  const isSender = message.sender._id === user.id;

  // Render attachment helper
  const renderAttachment = () => {
    if (!message.fileUrl) return null;

    switch (message.messageType) {
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
          <div className="attachment-preview-container" style={{ maxFormatWidth: '280px', maxHeight: 'none' }}>
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
    <div className={`message-wrapper ${isSender ? 'sender' : 'receiver'}`}>
      <span className="message-sender-name">
        {isSender ? 'You' : message.sender.username}
      </span>

      {/* RENDER INLINE REPLIES / QUOTED PREVIEWS */}
      {message.parentMessage && (
        <div
          className="quoted-message-preview"
          style={{ alignSelf: isSender ? 'flex-end' : 'flex-start' }}
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
      <div className={`message-bubble ${translating ? 'ai-highlight' : ''}`}>
        {/* Render media if any */}
        {renderAttachment()}

        {/* Text message */}
        {message.content && !message.isDeleted && (
          <p style={{ margin: 0, fontSize: '13.5px' }}>{message.content}</p>
        )}
        {message.isDeleted && (
          <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', opacity: 0.6 }}>
            {message.content}
          </p>
        )}

        {/* Chattix AI Translation card label */}
        {translationText && (
          <div
            style={{
              marginTop: '8px',
              padding: '6px 8px',
              background: 'rgba(6, 182, 212, 0.08)',
              borderTop: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#06b6d4',
              animation: 'slideDown 0.15s ease-out'
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>
              🌐 Chattix AI Translated ({translationLang})
            </div>
            <div>{translationText}</div>
          </div>
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
            <button className="bubble-option-btn" title="AI Translation" onClick={() => setShowLangDropdown(!showLangDropdown)}>
              <Globe size={12} />
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

            {/* Translation Languages Dropdown */}
            {showLangDropdown && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: isSender ? 'auto' : '0',
                  right: isSender ? '0' : 'auto',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  width: '110px',
                  zIndex: 30,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
              >
                {['English', 'Spanish', 'French', 'Japanese', 'German'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className="tab-btn"
                    style={{ textAlign: 'left', fontSize: '11px', padding: '4px 6px' }}
                    onClick={() => handleTranslate(lang)}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

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

      {/* Render emoji reactions list under bubble */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginTop: '2px',
            alignSelf: isSender ? 'flex-end' : 'flex-start',
            marginRight: isSender ? '8px' : '0',
            marginLeft: isSender ? '0' : '8px'
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
