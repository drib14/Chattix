import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Copy, Star, Reply, Trash2, Forward, Pin, BarChart3, Smile, MoreVertical, Plus, Music, Download, FileText } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import PollMessage from './PollMessage';
import CustomAudioPlayer from './CustomAudioPlayer';

const REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '😢'];

// Highlight @mentions in text
const highlightMentions = (text, isOwn) => {
  if (!text) return text;
  const mentionRegex = /@(\w+)/g;
  const parts = text.split(mentionRegex);
  const textColorClass = isOwn ? 'text-white' : 'text-gray-900';

  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <span key={idx} className="font-semibold text-chattix-primary cursor-pointer hover:underline">
          @{part}
        </span>
      );
    }
    return part;
  });
};

const ChatBubble = ({
  message,
  isOwn,
  isGroup,
  index,
  onReply,
  onReact,
  onEdit,
  onDeleteMe,
  onDeleteEveryone,
  onForward,
  onStar,
  onCopy,
  onPin,
  onScrollToReply,
  onViewInfo,
  onViewMedia,
  searchQuery,
  messageRef,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressRef = useRef(null);

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightText = (text = '') => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
    return text.split(regex).map((part, idx) => (
      regex.test(part) ? (
        <mark key={idx} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    ));
  };

  const triggerHaptic = (duration = 50) => {
    if (navigator.vibrate) navigator.vibrate(duration);
  };

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      triggerHaptic(50);
      setShowMobileMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-100 rounded-xl">
          This message was deleted
        </p>
      </div>
    );
  }

  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-3 w-full">
        <span className="text-[11px] font-medium text-gray-500 bg-gray-100/80 px-4 py-1.5 rounded-full text-center shadow-sm">
          {message.text}
        </span>
      </div>
    );
  }

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const attachment = message.attachments?.[0];
  const senderAvatar = message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.fullName || 'User')}&background=3B82F6&color=fff&bold=true`;
  const receiverAvatar = message.receiver?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.receiver?.fullName || 'User')}&background=3B82F6&color=fff&bold=true`;

  const getSeenStatus = () => {
    if (!message.seen || !message.seenBy?.length) return null;
    const seenAt = new Date(message.seenBy[0].seenAt);
    const isIgnored = (Date.now() - seenAt.getTime()) > 3600000; // 1 hour
    return { isIgnored };
  };

  const isDoc = attachment && (attachment.type === 'document' || attachment.type === 'pdf');
  const isAudio = attachment && attachment.type === 'audio';
  const isPureMedia = attachment && (attachment.type === 'image' || attachment.type === 'gif' || attachment.type === 'video') && !message.text && !message.poll;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className={`flex mb-1 group ${isOwn ? 'justify-end' : 'justify-start'} min-w-0`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex gap-2 max-w-[min(85%,280px)] sm:max-w-[80%] min-w-0 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Profile Image */}
        <div className="flex-shrink-0 self-end mb-1">
          <img src={senderAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
        </div>

        <div className="relative min-w-0">
          {message.replyTo && (
            <button
              type="button"
              onClick={() => onScrollToReply?.(message.replyTo._id)}
              className={`w-full text-left text-xs px-3 py-1 mb-1 rounded-lg border-l-4 border-chattix-accent bg-white/80 ${isOwn ? 'ml-auto' : ''}`}
            >
              <p className="font-semibold text-chattix-secondary truncate">
                {message.replyTo.sender?.fullName || 'User'}
              </p>
              <p className="text-gray-500 truncate">{message.replyTo.text || 'Attachment'}</p>
            </button>
          )}

          <div
            ref={messageRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`relative message-bubble ${isPureMedia || isDoc || isAudio
              ? 'bg-transparent p-0 shadow-none border-none'
              : `px-3 py-2 rounded-xl shadow-sm ${isOwn ? 'bg-chattix-primary text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm'}`
              }`}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu(true);
            }}
          >
            {(attachment?.type === 'image' || attachment?.type === 'gif') && (
              <div
                className={`relative cursor-pointer group/media ${isPureMedia ? 'mb-0.5' : 'mb-1'}`}
                onClick={() => onViewMedia?.(attachment)}
              >
                <img src={attachment.url} alt="" className={`max-w-full max-h-60 object-cover ${isPureMedia ? 'rounded-2xl shadow-md' : 'rounded-lg'}`} />
                <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover/media:opacity-100 transition-opacity ${isPureMedia ? 'rounded-2xl' : 'rounded-lg'}`} />
              </div>
            )}
            {attachment?.type === 'video' && (
              <div className={`relative cursor-pointer group/media ${isPureMedia ? 'mb-0.5' : 'mb-1'}`} onClick={() => onViewMedia?.(attachment)}>
                <video
                  src={attachment.url}
                  className={`max-w-full max-h-60 bg-black ${isPureMedia ? 'rounded-2xl shadow-md' : 'rounded-lg'}`}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover/media:bg-black/25 transition-colors">
                  <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                </div>
              </div>
            )}
            {isAudio && (
              <div className={`flex flex-col gap-2 p-3 rounded-2xl w-64 xs:w-72 max-w-full shadow-sm ${isOwn ? 'bg-chattix-primary text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-chattix-primary'}`}>
                    <Music size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${isOwn ? 'text-white' : 'text-gray-800'}`} title={attachment.filename}>
                      {attachment.filename || 'Voice Note'}
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      Audio
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <CustomAudioPlayer src={attachment.url} isOwn={isOwn} />
                </div>
              </div>
            )}
            {isDoc && (
              <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl w-64 xs:w-72 max-w-full shadow-sm transition-colors ${isOwn ? 'bg-chattix-primary text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs uppercase shadow-sm ${isOwn ? 'bg-white/20 text-white' : 'bg-gray-100 text-chattix-primary'}`}>
                    {attachment.type === 'pdf' ? 'PDF' : (attachment.filename?.split('.').pop()?.substring(0, 4) || 'DOC')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${isOwn ? 'text-white' : 'text-gray-800'}`} title={attachment.filename}>
                      {attachment.filename || 'Untitled document'}
                    </p>
                    <p className={`text-[10px] uppercase tracking-wider ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {attachment.type || 'File'}
                    </p>
                  </div>
                </div>
                <a
                  href={attachment.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={`p-2 rounded-full shadow-sm transition-colors shrink-0 ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-chattix-primary'}`}
                  title="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={16} />
                </a>
              </div>
            )}

            {/* Poll Message */}
            {message.poll && message.poll.question ? (
              <PollMessage message={message} isGroup={isGroup} />
            ) : (
              <>
                {message.text && (
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {highlightMentions(message.text, isOwn)}
                    {message.edited && <span className="text-[10px] text-gray-400 ml-1">(edited)</span>}
                  </p>
                )}
              </>
            )}
            {message.forwarded && (
              <p className="text-[10px] text-gray-400 italic">Forwarded</p>
            )}

            <div className={`flex flex-col items-end gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded shadow-sm absolute -top-5 whitespace-nowrap"
                  >
                    {formatTime(message.createdAt)}
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-1">
                {message.pinned && <Pin size={10} className="text-gray-400" />}
                {isOwn && !isGroup && (
                  message.seen ? (
                    <div className="flex items-center gap-1">
                      {getSeenStatus()?.isIgnored && (
                        <span className="text-[10px] text-gray-500 italic">ignored</span>
                      )}
                      <img src={receiverAvatar} alt="seen by" className="w-3.5 h-3.5 rounded-full object-cover border border-gray-200" title="Seen" />
                    </div>
                  ) : message.delivered ? (
                    <CheckCheck size={14} className="text-blue-500" title="Delivered" />
                  ) : (
                    <Check size={14} className="text-blue-300 opacity-70" title="Sent" />
                  )
                )}
                {isOwn && isGroup && (
                  message.seen ? (
                    <CheckCheck size={14} className="text-blue-500" />
                  ) : message.delivered ? (
                    <CheckCheck size={14} className="text-gray-400" />
                  ) : (
                    <Check size={14} className="text-gray-400" />
                  )
                )}
              </div>
            </div>

            {Array.isArray(message.reactions) && message.reactions.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {message.reactions.map((r, i) => (
                  <span key={i} className="text-xs bg-white rounded-full px-1.5 py-0.5 shadow-sm">
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hover Tool Strip */}
          <div className={`hidden sm:flex items-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'} ${isOwn ? 'mr-1 flex-row-reverse' : 'ml-1 flex-row'}`}>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowReactions((v) => !v); setShowMenu(false); }}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-white shadow-sm"
                title="React"
              >
                <Smile size={14} />
              </button>
              {showReactions && (
                <div className={`absolute bottom-full mb-1 z-20 flex gap-1 p-1 bg-white rounded-full border border-gray-200 shadow-md ${isOwn ? 'right-0' : 'left-0'}`}>
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { onReact?.(message, emoji); setShowReactions(false); }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onReply?.(message)}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-white shadow-sm"
              title="Reply"
            >
              <Reply size={14} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowMenu((v) => !v); setShowReactions(false); }}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-white shadow-sm"
                title="More"
              >
                <MoreVertical size={14} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} aria-hidden="true" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`absolute z-40 top-full mt-1 max-h-[60vh] overflow-y-auto w-[min(180px,calc(100vw-2rem))] bg-white rounded-xl shadow-lg border border-gray-100 py-1 ${isOwn ? 'right-0' : 'left-0'}`}
                    >
                      {
                        (() => {
                          const items = [];
                          items.push({ icon: Copy, label: 'Copy', action: () => onCopy?.(message) });
                          items.push({ icon: Star, label: 'Star', action: () => onStar?.(message) });
                          items.push({ icon: Forward, label: 'Forward', action: () => onForward?.(message) });
                          if (isOwn) items.push({ icon: Trash2, label: 'Edit', action: () => onEdit?.(message) });
                          if (isOwn) {
                            if (!message.group && onDeleteEveryone) items.push({ icon: Trash2, label: 'Delete For Everyone', action: () => onDeleteEveryone?.(message) });
                            items.push({ icon: Trash2, label: 'Delete', action: () => onDeleteMe?.(message) });
                          } else {
                            items.push({ icon: Trash2, label: 'Delete', action: () => onDeleteMe?.(message) });
                          }
                          if (message.group) {
                            items.push({ icon: Pin, label: 'Message Info', action: () => onViewInfo?.(message) });
                          }
                          return items.map(({ icon: Icon, label, action }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => { action(); setShowMenu(false); setShowReactions(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Icon size={14} />
                              {label}
                            </button>
                          ));
                        })()
                      }
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowMobileMenu(false)} aria-hidden="true" />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28 }}
                  className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl p-4 safe-bottom"
                >
                  <div className="max-w-lg mx-auto space-y-3">
                    <button
                      type="button"
                      onClick={() => { onReply?.(message); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Reply size={18} />
                      Reply
                    </button>

                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-2">React</div>
                      <div className="flex gap-2">
                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => { onReact?.(message, emoji); setShowMobileMenu(false); }}
                            className="text-2xl"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => { onEdit?.(message); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <Trash2 size={18} />
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { onDeleteMe?.(message); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={() => { onCopy?.(message); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Copy size={18} />
                      Copy
                    </button>

                    <button
                      type="button"
                      onClick={() => { onForward?.(message); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Forward size={18} />
                      Forward
                    </button>

                    <button
                      type="button"
                      onClick={() => { onStar?.(message); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Star size={18} />
                      Star
                    </button>

                    {message.group && (
                      <button
                        type="button"
                        onClick={() => { onViewInfo?.(message); setShowMobileMenu(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <Pin size={18} />
                        View Message Info
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
