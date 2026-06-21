import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Image, Mic, Paperclip, Square } from 'lucide-react';
import api from '../../services/api';
import socketService from '../../services/socket';
import { addMessage, setMessages, updateChatLastMessage } from '../../redux/slices/chatSlice';
import ChatBubble from './ChatBubble';
import SkeletalLoader from '../ui/SkeletalLoader';
import MediaGalleryModal from '../modals/MediaGalleryModal';

const ChatWindow = () => {
  const { selectedChat, messages, onlineUsers } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [messageText, setMessageText] = useState('');
  const [fetching, setFetching] = useState(false);
  const [typingPartner, setTypingPartner] = useState(null);
  
  // File upload state trackers
  const [uploadPercent, setUploadPercent] = useState(null);
  const [uploadingName, setUploadingName] = useState('');
  
  // Voice Recording state trackers
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Gallery Modal Lightbox
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Auto-scroll messages stream to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingPartner]);

  // Load message logs & socket setup
  useEffect(() => {
    if (!selectedChat?._id) return;

    const loadMessages = async () => {
      setFetching(true);
      try {
        const data = await api.get(`/messages/${selectedChat._id}`);
        dispatch(setMessages(data));
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setFetching(false);
      }
    };

    loadMessages();

    // Listen to Socket rooms
    socketService.joinChat(selectedChat._id);

    const onMessageReceived = (newMessage) => {
      if (newMessage.chat._id === selectedChat._id || newMessage.chat === selectedChat._id) {
        dispatch(addMessage(newMessage));
        dispatch(updateChatLastMessage({ chatId: selectedChat._id, message: newMessage }));
      }
    };

    const onTyping = ({ chatId, username }) => {
      if (chatId === selectedChat._id && username !== user?.username) {
        setTypingPartner(username);
      }
    };

    const onStopTyping = ({ chatId, username }) => {
      if (chatId === selectedChat._id && username !== user?.username) {
        setTypingPartner(null);
      }
    };

    socketService.on('message_received', onMessageReceived);
    socketService.on('typing', onTyping);
    socketService.on('stop_typing', onStopTyping);

    return () => {
      socketService.leaveChat(selectedChat._id);
      socketService.off('message_received', onMessageReceived);
      socketService.off('typing', onTyping);
      socketService.off('stop_typing', onStopTyping);
      setTypingPartner(null);
    };
  }, [selectedChat?._id, dispatch, user?.username]);

  // Handle typing emissions
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (selectedChat?._id) {
      socketService.emit('typing', { chatId: selectedChat._id, username: user?.username });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emit('stop_typing', { chatId: selectedChat._id, username: user?.username });
      }, 2000);
    }
  };

  // Submit Text Message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() && !uploadPercent) return;

    const payload = {
      chatId: selectedChat._id,
      text: messageText,
    };

    setMessageText('');
    socketService.emit('stop_typing', { chatId: selectedChat._id, username: user?.username });

    try {
      const sentMsg = await api.post('/messages', payload);
      dispatch(addMessage(sentMsg));
      dispatch(updateChatLastMessage({ chatId: selectedChat._id, message: sentMsg }));
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Direct Attachment Uploader with Progress Bar hooks
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadingName(file.name);
    setUploadPercent(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.upload('/messages/upload', formData, (percent) => {
        setUploadPercent(percent);
      });

      if (response.success && response.attachment) {
        // Send message with attachment metadata
        const attachmentMsg = await api.post('/messages', {
          chatId: selectedChat._id,
          attachments: [response.attachment],
        });
        dispatch(addMessage(attachmentMsg));
        dispatch(updateChatLastMessage({ chatId: selectedChat._id, message: attachmentMsg }));
      }
    } catch (err) {
      console.error('Attachment upload failed:', err);
    } finally {
      setUploadPercent(null);
      setUploadingName('');
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        // Upload recorded file
        await handleFileUpload(audioFile);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getChatPartnerDetails = () => {
    if (!selectedChat) return null;
    if (selectedChat.isGroup) {
      return {
        name: selectedChat.groupName,
        avatar: selectedChat.groupAvatar,
        isOnline: false,
      };
    }
    const partner = selectedChat.participants.find((p) => p._id !== user?._id);
    const isOnline = onlineUsers.includes(partner?._id);
    return {
      name: partner?.fullName || 'Chattix User',
      avatar: partner?.avatar,
      isOnline,
    };
  };

  const partnerDetails = getChatPartnerDetails();

  const handleOpenGallery = (mediaUrl) => {
    setActiveMediaUrl(mediaUrl);
    setIsGalleryOpen(true);
  };

  if (!selectedChat) {
    return (
      <div style={styles.blankState}>
        <div style={styles.blankIconBox}>💬</div>
        <h4 style={styles.blankTitle}>Your Chattix Space</h4>
        <p style={styles.blankSubtitle}>Select a chat room or start searching for friends to start messaging.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Profile Section */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <img
            src={partnerDetails?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(partnerDetails?.name || 'U')}`}
            alt=""
            style={styles.avatar}
          />
          <div>
            <h4 style={styles.name}>{partnerDetails?.name}</h4>
            <span style={styles.status}>
              {selectedChat.isGroup
                ? `${selectedChat.participants?.length || 0} participants`
                : partnerDetails?.isOnline
                ? 'Online'
                : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Logs Area */}
      <div style={styles.messageArea}>
        {fetching ? (
          <SkeletalLoader type="bubble" count={5} />
        ) : messages.length === 0 ? (
          <div style={styles.emptyPrompt}>
            <span>👋</span>
            <p>Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatBubble
              key={msg._id || index}
              message={msg}
              isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
              onViewMedia={handleOpenGallery}
            />
          ))
        )}

        {/* Typing indicator bubble */}
        {typingPartner && (
          <div style={styles.typingRow}>
            <div style={styles.typingBubble} className="clay-bubble-other">
              <span style={styles.typingText}>@{typingPartner} is typing</span>
              <div style={styles.dots}>
                <div style={styles.dot} />
                <div style={styles.dot} />
                <div style={styles.dot} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress Overlay */}
      {uploadPercent !== null && (
        <div style={styles.progressOverlay}>
          <div style={styles.progressCard} className="clay-card">
            <span style={styles.uploadingName} className="text-truncate">Uploading: {uploadingName}</span>
            <div style={styles.progressBarWrapper}>
              <div style={{ ...styles.progressBar, width: `${uploadPercent}%` }} />
            </div>
            <span style={styles.progressPercent}>{uploadPercent}% completed</span>
          </div>
        </div>
      )}

      {/* Action Input Panel Footer */}
      <div style={styles.inputPanel}>
        {isRecording ? (
          <div style={styles.recordingRow} className="clay-card">
            <span style={styles.recordingTimer}>Recording: {formatTimer(recordingSeconds)}</span>
            <div style={styles.wave} />
            <button onClick={stopRecording} style={styles.stopBtn} className="clay-btn">
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} style={styles.inputForm}>
            {/* Input triggers */}
            <div style={styles.options}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.optBtn} title="Send Image/Video">
                <Image size={18} />
              </button>
              <button type="button" onClick={() => docInputRef.current?.click()} style={styles.optBtn} title="Attach Document">
                <Paperclip size={18} />
              </button>
              <button type="button" onClick={startRecording} style={styles.optBtn} title="Record voice message">
                <Mic size={18} />
              </button>
            </div>

            <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*,video/*" onChange={(e) => handleFileUpload(e.target.files[0])} />
            <input ref={docInputRef} type="file" style={{ display: 'none' }} accept="*" onChange={(e) => handleFileUpload(e.target.files[0])} />

            <input
              type="text"
              placeholder="Type your message..."
              value={messageText}
              onChange={handleInputChange}
              className="clay-input"
              style={styles.textInput}
            />

            <button type="submit" disabled={!messageText.trim()} style={styles.sendBtn} className="clay-btn clay-btn-primary">
              <Send size={16} />
            </button>
          </form>
        )}
      </div>

      {/* Messenger Lightbox Modal */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        activeMediaUrl={activeMediaUrl}
        setActiveMediaUrl={setActiveMediaUrl}
        messages={messages}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  blankState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px',
    background: '#ffffff',
  },
  blankIconBox: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  blankTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  blankSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    maxWidth: '300px',
  },
  header: {
    height: '68px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    background: '#ffffff',
    zIndex: 10,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: '#f1f5f9',
  },
  name: {
    fontSize: '14.5px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  status: {
    fontSize: '11px',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  messageArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emptyPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'var(--text-light)',
    fontSize: '13px',
    height: '100%',
  },
  typingRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: '8px',
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
  },
  typingText: {
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  dots: {
    display: 'flex',
    gap: '3px',
  },
  dot: {
    width: '5px',
    height: '5px',
    background: 'var(--clay-primary)',
    borderRadius: '50%',
    animation: 'pulseSkeletal 1.2s infinite ease-in-out',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: '80px',
    left: '20px',
    right: '20px',
    zIndex: 100,
  },
  progressCard: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
  },
  uploadingName: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  progressBarWrapper: {
    width: '100%',
    height: '6px',
    background: '#e2e8f0',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressBar: {
    height: '100%',
    background: 'var(--clay-primary)',
    borderRadius: '9999px',
  },
  progressPercent: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--clay-primary)',
    alignSelf: 'flex-end',
  },
  inputPanel: {
    padding: '14px 20px',
    background: '#ffffff',
    borderTop: '1px solid #f1f5f9',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  options: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  optBtn: {
    background: 'transparent',
    border: 'none',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  textInput: {
    flex: 1,
    padding: '12px 18px',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    padding: 0,
    flexShrink: 0,
  },
  recordingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'var(--clay-danger-light)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    width: '100%',
  },
  recordingTimer: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--clay-danger)',
  },
  stopBtn: {
    background: 'var(--clay-danger)',
    color: '#ffffff',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--clay-shadow-button)',
  },
};

export default ChatWindow;
