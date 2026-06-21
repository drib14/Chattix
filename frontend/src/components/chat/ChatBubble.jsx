import { FileText, Download } from 'lucide-react';
import LinkPreviewCard from './LinkPreviewCard';
import VoicePlayer from './VoicePlayer';

const ChatBubble = ({ message, isOwn, onViewMedia }) => {
  const attachment = message.attachments?.[0];

  const formatText = (text) => {
    if (!text) return null;
    const tokenRegex = /(@\w+|https?:\/\/[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?\b)/gi;
    const parts = text.split(tokenRegex);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="bubble-mention">
            {part}
          </span>
        );
      } else if (part.match(/https?:\/\/[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}\b/i)) {
        const href = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="bubble-link">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="bubble-row" style={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      {/* Sender Avatar */}
      {!isOwn && (
        <img
          src={message.sender?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(message.sender?.fullName || 'U')}`}
          alt=""
          className="bubble-sender-avatar"
        />
      )}

      <div className="bubble-wrapper" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {/* Name details */}
        {!isOwn && <span className="bubble-sender-name">{message.sender?.fullName}</span>}

        <div
          className={`${isOwn ? 'clay-bubble-own' : 'clay-bubble-other'} bubble-content-box`}
          style={{
            padding: attachment && !message.text ? '0' : '10px 16px',
            background: attachment && !message.text ? 'transparent' : undefined,
            border: attachment && !message.text ? 'none' : undefined,
            boxShadow: attachment && !message.text ? 'none' : undefined,
          }}
        >
          {/* Main text message */}
          {message.text && (
            <p className="bubble-message-text">{formatText(message.text)}</p>
          )}

          {/* Attachment options rendering */}
          {attachment && (
            <div className="bubble-attachments-container">
              {/* Image Thumbnail */}
              {attachment.type === 'image' && (
                <div className="bubble-media-wrapper" onClick={() => onViewMedia(attachment.url)}>
                  <img src={attachment.url} alt="" className="bubble-media-element" />
                </div>
              )}

              {/* Video Thumbnail */}
              {attachment.type === 'video' && (
                <div className="bubble-media-wrapper" onClick={() => onViewMedia(attachment.url)}>
                  <video src={attachment.url} className="bubble-media-element" />
                  <div className="bubble-play-overlay">
                    <div className="bubble-play-icon">▶</div>
                  </div>
                </div>
              )}

              {/* Voice Player */}
              {attachment.type === 'audio' && (
                <VoicePlayer src={attachment.url} isOwn={isOwn} />
              )}

              {/* File Attachment */}
              {attachment.type === 'file' && (
                <div
                  className="bubble-file-card"
                  style={{
                    background: isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f8fafc',
                    borderColor: isOwn ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  }}
                >
                  <div className="bubble-file-row">
                    <div
                      className="bubble-file-icon-box"
                      style={{
                        background: isOwn ? 'rgba(255, 255, 255, 0.3)' : 'var(--clay-primary-light)',
                        color: isOwn ? '#ffffff' : 'var(--clay-primary)',
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="bubble-file-info">
                      <p
                        className="bubble-file-name text-truncate"
                        style={{ color: isOwn ? '#ffffff' : 'var(--text-primary)' }}
                        title={attachment.filename}
                      >
                        {attachment.filename}
                      </p>
                      <p className={`bubble-file-size ${isOwn ? 'bubble-file-size-own' : 'bubble-file-size-other'}`}>
                        {formatSize(attachment.size)}
                      </p>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="bubble-file-download"
                      style={{ color: isOwn ? '#ffffff' : 'var(--text-secondary)' }}
                      title="Download attachment"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scraped OpenGraph Link Previews */}
          {message.linkPreview && (
            <LinkPreviewCard preview={message.linkPreview} />
          )}
        </div>
        
        {/* Timestamp */}
        <span className="bubble-timestamp">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;

