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
          <span key={idx} style={styles.mention}>
            {part}
          </span>
        );
      } else if (part.match(/https?:\/\/[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}\b/i)) {
        const href = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a key={idx} href={href} target="_blank" rel="noopener noreferrer" style={styles.link}>
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
    <div style={{
      ...styles.row,
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
    }}>
      {/* Sender Avatar */}
      {!isOwn && (
        <img
          src={message.sender?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(message.sender?.fullName || 'U')}`}
          alt=""
          style={styles.avatar}
        />
      )}

      <div style={{
        ...styles.bubbleWrapper,
        alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}>
        {/* Name details */}
        {!isOwn && <span style={styles.senderName}>{message.sender?.fullName}</span>}

        <div
          className={isOwn ? 'clay-bubble-own' : 'clay-bubble-other'}
          style={{
            ...styles.bubble,
            padding: attachment && !message.text ? '0' : '10px 16px',
            background: attachment && !message.text ? 'transparent' : undefined,
            border: attachment && !message.text ? 'none' : undefined,
            boxShadow: attachment && !message.text ? 'none' : undefined,
          }}
        >
          {/* Main text message */}
          {message.text && (
            <p style={styles.text}>{formatText(message.text)}</p>
          )}

          {/* Attachment options rendering */}
          {attachment && (
            <div style={styles.attachmentWrapper}>
              {/* Image Thumbnail */}
              {attachment.type === 'image' && (
                <div style={styles.mediaContainer} onClick={() => onViewMedia(attachment.url)}>
                  <img src={attachment.url} alt="" style={styles.mediaElement} />
                </div>
              )}

              {/* Video Thumbnail */}
              {attachment.type === 'video' && (
                <div style={styles.mediaContainer} onClick={() => onViewMedia(attachment.url)}>
                  <video src={attachment.url} style={styles.mediaElement} />
                  <div style={styles.playOverlay}>
                    <div style={styles.playIcon}>▶</div>
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
                  style={{
                    ...styles.fileCard,
                    background: isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f8fafc',
                    borderColor: isOwn ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  }}
                >
                  <div style={styles.fileRow}>
                    <div style={{
                      ...styles.fileIconBox,
                      background: isOwn ? 'rgba(255, 255, 255, 0.3)' : 'var(--clay-primary-light)',
                      color: isOwn ? '#ffffff' : 'var(--clay-primary)',
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={styles.fileInfo}>
                      <p style={{
                        ...styles.filename,
                        color: isOwn ? '#ffffff' : 'var(--text-primary)',
                      }} className="text-truncate" title={attachment.filename}>
                        {attachment.filename}
                      </p>
                      <p style={isOwn ? styles.sizeOwn : styles.sizeOther}>{formatSize(attachment.size)}</p>
                    </div>
                    <a href={attachment.url} target="_blank" rel="noreferrer" download style={{
                      ...styles.downloadBtn,
                      color: isOwn ? '#ffffff' : 'var(--text-secondary)',
                    }} title="Download attachment">
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
        <span style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const styles = {
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    width: '100%',
    marginBottom: '8px',
    animation: 'popIn 0.2s ease-out',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '10px',
    objectFit: 'cover',
    marginBottom: '4px',
  },
  bubbleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '70%',
  },
  senderName: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-light)',
    marginBottom: '3px',
    marginLeft: '4px',
  },
  bubble: {
    maxWidth: '100%',
  },
  text: {
    fontSize: '14px',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  mention: {
    color: 'var(--clay-primary)',
    fontWeight: 700,
    cursor: 'pointer',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  attachmentWrapper: {
    marginTop: '6px',
    width: '100%',
  },
  mediaContainer: {
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    maxWidth: '240px',
    height: '160px',
    position: 'relative',
    background: '#e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  mediaElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    paddingLeft: '3px',
  },
  fileCard: {
    borderRadius: '16px',
    border: '1.5px solid',
    width: '240px',
    maxWidth: '100%',
    padding: '8px 12px',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  fileIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  filename: {
    fontSize: '13px',
    fontWeight: 700,
  },
  sizeOwn: {
    fontSize: '10px',
    color: '#e0e7ff',
  },
  sizeOther: {
    fontSize: '10px',
    color: 'var(--text-light)',
  },
  downloadBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: '10px',
    color: 'var(--text-light)',
    marginTop: '3px',
    marginLeft: '6px',
    marginRight: '6px',
  },
};

export default ChatBubble;
