import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FileText, Download, Smile, Reply, MoreVertical, Trash } from 'lucide-react';
import LinkPreviewCard from './LinkPreviewCard';
import VoicePlayer from './VoicePlayer';
import { api } from '../../services/api';
import { updateMessageState } from '../../redux/slices/chatSlice';
import ConfirmationModal from '../modals/ConfirmationModal';

const ChatBubble = ({ message, isOwn, onViewMedia }) => {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const attachment = message.attachments?.[0];
  const dispatch = useDispatch();

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/${message._id}`);
      dispatch(updateMessageState({ messageId: message._id, updates: { isDeleted: true, text: '', attachments: [], linkPreview: null } }));
      setShowMoreActions(false);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

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
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="bubble-link"
            id={`bubble-text-link-${message._id}-${idx}`}
          >
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

  const renderActions = () => (
    <div className="bubble-actions" style={{ flexDirection: isOwn ? 'row-reverse' : 'row', position: 'relative' }}>
      <button
        className="bubble-action-btn"
        title="Quick React"
        onClick={() => {
          // Here we would typically dispatch an action or API call to save the reaction
          // e.g. api.post(`/messages/${message._id}/react`, { emoji: user?.quickReaction || '👍' })
          console.log(`Reacted with ${message.sender?.quickReaction || '👍'}`);
        }}
      >
        <span style={{ fontSize: '12px' }}>{message.sender?.quickReaction || '👍'}</span>
      </button>
      <button className="bubble-action-btn" title="React"><Smile size={14} /></button>
      <button className="bubble-action-btn" title="Reply"><Reply size={14} /></button>
      <button className="bubble-action-btn" title="More" onClick={() => setShowMoreActions(!showMoreActions)}>
        <MoreVertical size={14} />
      </button>

      {showMoreActions && isOwn && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: isOwn ? '0' : 'auto',
          left: isOwn ? 'auto' : '0',
          background: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          padding: '4px',
          zIndex: 10
        }}>
          <button
            onClick={() => { setShowDeleteModal(true); setShowMoreActions(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', padding: '6px 12px', width: '100%', cursor: 'pointer', color: 'var(--clay-danger)', fontSize: '12px', fontWeight: 'bold' }}
          >
            <Trash size={12} /> Unsend
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Unsend Message"
        message="Are you sure you want to unsend this message for everyone? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Unsend"
      />
    </div>
  );

  if (message.type === 'system') {
    return (
      <div className="system-message-row">
        <span className="system-message-bubble">{message.text}</span>
      </div>
    );
  }

  return (
    <div className="bubble-row" style={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      {/* Name details are removed from bubble to match Messenger, as they are in the header */}

      {!isOwn && !message.isDeleted && renderActions()}

      <div className="bubble-wrapper" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>

        <div
          onClick={() => !message.isDeleted && setShowTimestamp(!showTimestamp)}
          className={message.isDeleted ? 'bubble-message-deleted' : `${isOwn ? 'clay-bubble-own' : 'clay-bubble-other'} bubble-content-box`}
          style={!message.isDeleted ? {
            padding: attachment && !message.text ? '0' : '10px 16px',
            background: attachment && !message.text ? 'transparent' : undefined,
            border: attachment && !message.text ? 'none' : undefined,
            boxShadow: attachment && !message.text ? 'none' : undefined,
          } : {}}
        >
          {message.isDeleted ? (
            <span>You unsent a message</span>
          ) : (
            <>
              {/* Main text message */}
              {message.text && (
                <p className="bubble-message-text">{formatText(message.text)}</p>
              )}

              {/* Attachment options rendering */}
              {attachment && (
            <div className="bubble-attachments-container">
              {/* Image Thumbnail */}
              {attachment.type === 'image' && (
                <div className="bubble-media-wrapper" onClick={() => onViewMedia(attachment.url)} id={`bubble-media-wrapper-${message._id}`}>
                  <img src={attachment.url} alt="" className="bubble-media-element" id={`bubble-media-img-${message._id}`} />
                </div>
              )}

              {/* Video Thumbnail */}
              {attachment.type === 'video' && (
                <div className="bubble-media-wrapper" onClick={() => onViewMedia(attachment.url)} id={`bubble-media-wrapper-${message._id}`}>
                  <video src={attachment.url} className="bubble-media-element" id={`bubble-media-video-${message._id}`} />
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
                      id={`bubble-file-download-${message._id}`}
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
            </>
          )}
        </div>
        
        {/* Read Receipt / Time shows conditionally on click */}
        {showTimestamp && (
          <div className="bubble-timestamp-popup" id={`bubble-time-${message._id}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isOwn && (
              <span className="bubble-read-receipt" id={`bubble-receipt-${message._id}`}>
                {message.seenBy?.some((s) => s.user !== message.sender._id || s.user !== message.sender) ? ' • Read' : ' • Sent'}
              </span>
            )}
          </div>
        )}
      </div>

      {isOwn && !message.isDeleted && renderActions()}
    </div>
  );
};

export default ChatBubble;

