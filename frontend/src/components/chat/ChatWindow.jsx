import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Send, Image, Mic, Paperclip, Square, Palette, ChevronLeft, Plus, Smile, Calendar, X } from 'lucide-react';
import api from '../../services/api';
import socketService from '../../services/socket';
import { addMessage, setMessages, updateChatLastMessage, updateMessageState } from '../../redux/slices/chatSlice';
import ChatBubble from './ChatBubble';
import SkeletalLoader from '../ui/SkeletalLoader';
import MediaGalleryModal from '../modals/MediaGalleryModal';
import ClayDoodleModal from '../modals/ClayDoodleModal';
import EmojiPicker from './EmojiPicker';
import GiphySearch from './GiphySearch';
import InfoPanel from './InfoPanel';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // First chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); 
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); 
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second chime note (slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08); 
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); 
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
};

const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return '';
  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return '1m';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}hr`;
  return `${diffDays}d`;
};

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
  const [isDoodleOpen, setIsDoodleOpen] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showGiphy, setShowGiphy] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        
        // Play bubble pop/glass chime sound for incoming messages
        const senderId = newMessage.sender?._id || newMessage.sender;
        if (senderId !== user?._id) {
          playNotificationSound();
        }
      }
    };

    const onMessageDeleted = (messageId) => {
      dispatch(updateMessageState({ messageId, updates: { isDeleted: true, text: '', attachments: [], linkPreview: null } }));
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
    socketService.on('message_deleted', onMessageDeleted);
    socketService.on('typing', onTyping);
    socketService.on('stop_typing', onStopTyping);

    return () => {
      socketService.leaveChat(selectedChat._id);
      socketService.off('message_received', onMessageReceived);
      socketService.off('message_deleted', onMessageDeleted);
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
  const handleSendTextOrGif = async (text, gifUrl = null) => {
    const payload = {
      chatId: selectedChat._id,
      text: text,
    };
    if (gifUrl) {
      payload.attachments = [{ url: gifUrl, filename: 'giphy.gif', type: 'image' }];
    }

    try {
      const sentMsg = await api.post('/messages', payload);
      dispatch(addMessage(sentMsg));
      dispatch(updateChatLastMessage({ chatId: selectedChat._id, message: sentMsg }));
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() && !uploadPercent) return;

    const payload = {
      chatId: selectedChat._id,
      text: messageText,
    };

    setMessageText('');
    socketService.emit('stop_typing', { chatId: selectedChat._id, username: user?.username });

    await handleSendTextOrGif(payload.text);
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
      lastSeen: partner?.lastSeen,
    };
  };

  const partnerDetails = getChatPartnerDetails();

  const handleOpenGallery = (mediaUrl) => {
    setActiveMediaUrl(mediaUrl);
    setIsGalleryOpen(true);
  };

  if (!selectedChat) {
    return (
      <div className="chat-window-blank-state">
        <div className="chat-window-blank-icon-box">💬</div>
        <h4 className="chat-window-blank-title">Your Chattix Space</h4>
        <p className="chat-window-blank-subtitle">Select a chat room or start searching for friends to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      {/* Header Profile Section */}
      <div className="chat-window-header">
        <button className="mobile-back-btn" onClick={() => navigate('/messages')}>
          <ChevronLeft size={24} />
        </button>
        <div className="chat-window-header-info">
          <img
            src={partnerDetails?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(partnerDetails?.name || 'U')}`}
            alt=""
            className="chat-window-avatar"
          />
          <div>
            <h4 className="chat-window-name">{partnerDetails?.name}</h4>
            <span className="chat-window-status">
              {selectedChat.isGroup
                ? `${selectedChat.participants?.length || 0} participants`
                : partnerDetails?.isOnline
                ? (
                    <span className="flex-center" style={{ gap: '6px', color: 'var(--clay-success, #10b981)', display: 'inline-flex' }}>
                      <span className="clay-online-dot" /> Online
                    </span>
                  )
                : partnerDetails?.lastSeen
                ? `Last seen ${formatLastSeen(partnerDetails.lastSeen)} ago`
                : 'Offline'}
            </span>
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="chat-window-opt-btn"
            title="Chat Info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Messages Logs Area */}
          <div className="chat-window-message-area">
        {fetching ? (
          <SkeletalLoader type="bubble" count={5} />
        ) : messages.length === 0 ? (
          <div className="chat-window-empty-prompt">
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
          <div className="chat-window-typing-row">
            <div className="chat-window-typing-bubble clay-bubble-other">
              <span className="chat-window-typing-text">@{typingPartner} is typing</span>
              <div className="chat-window-typing-dots">
                <div className="chat-window-typing-dot" />
                <div className="chat-window-typing-dot" />
                <div className="chat-window-typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress Overlay */}
      {uploadPercent !== null && (
        <div className="chat-window-progress-overlay">
          <div className="chat-window-progress-card clay-card">
            <span className="chat-window-upload-name text-truncate">Uploading: {uploadingName}</span>
            <div className="chat-window-progress-bar-wrapper">
              <div className="chat-window-progress-bar" style={{ width: `${uploadPercent}%` }} />
            </div>
            <span className="chat-window-progress-percent">{uploadPercent}% completed</span>
          </div>
        </div>
      )}

          {/* Action Input Panel Footer */}
          <div className="chat-window-input-panel">
            {isRecording ? (
          <div className="chat-window-recording-row clay-card">
            <span className="chat-window-recording-timer">Recording: {formatTimer(recordingSeconds)}</span>
            <div style={{ flex: 1 }} />
            <button onClick={stopRecording} className="chat-window-stop-btn" id="chat-stop-record-btn">
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="chat-window-input-form" id="chat-message-form">
            {/* Input triggers */}
            <div className="chat-window-options" style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className={`chat-window-opt-btn ${showPlusMenu ? 'active' : ''}`}
                  title="More Tools"
                >
                  <Plus size={20} style={{ transition: 'transform 0.2s', transform: showPlusMenu ? 'rotate(45deg)' : 'none' }} />
                </button>

                {/* Plus Menu Dropdown */}
                {showPlusMenu && (
                  <div className="clay-card plus-menu-dropdown" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '10px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    width: 'max-content'
                  }}>
                    <button type="button" onClick={() => { setShowGiphy(!showGiphy); setShowPlusMenu(false); }} className="plus-menu-item">
                      GIFs
                    </button>
                    <button type="button" onClick={() => { docInputRef.current?.click(); setShowPlusMenu(false); }} className="plus-menu-item">
                      <Paperclip size={16} style={{ marginRight: '8px' }} /> File
                    </button>
                    <button type="button" onClick={() => { setIsDoodleOpen(true); setShowPlusMenu(false); }} className="plus-menu-item">
                      <Palette size={16} style={{ marginRight: '8px' }} /> Doodle
                    </button>
                    <button type="button" onClick={() => { /* Event tool placeholder */ setShowPlusMenu(false); }} className="plus-menu-item">
                      <Calendar size={16} style={{ marginRight: '8px' }} /> Create Event
                    </button>
                  </div>
                )}
              </div>

              <button type="button" onClick={() => fileInputRef.current?.click()} className="chat-window-opt-btn" title="Send Media">
                <Image size={18} />
              </button>
              <button type="button" onClick={startRecording} className="chat-window-opt-btn" title="Voice Message">
                <Mic size={18} />
              </button>
            </div>

            <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*,video/*" onChange={(e) => handleFileUpload(e.target.files[0])} id="chat-file-input" />
            <input ref={docInputRef} type="file" style={{ display: 'none' }} accept="*" onChange={(e) => handleFileUpload(e.target.files[0])} id="chat-doc-input" />

            <div style={{ flex: 1, position: 'relative' }}>
              {showGiphy && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '10px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 101 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 10px 0', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Giphy</span>
                    <button type="button" onClick={() => setShowGiphy(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
                  </div>
                  <GiphySearch onGifSelect={(url) => { handleSendTextOrGif('', url); setShowGiphy(false); }} />
                </div>
              )}
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={handleInputChange}
                className="clay-input chat-window-text-input"
                id="chat-text-input"
                style={{ width: '100%' }}
              />
            </div>

                <EmojiPicker onEmojiSelect={(emoji) => setMessageText(prev => prev + emoji)} />

                <button type="submit" disabled={!messageText.trim()} className="clay-btn clay-btn-primary chat-window-send-btn" id="chat-send-btn">
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Lightbox Rendering System */}
          <MediaGalleryModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            activeMediaUrl={activeMediaUrl}
            setActiveMediaUrl={setActiveMediaUrl}
            messages={messages}
          />

          {/* Clay Doodle Draw Modal */}
          <ClayDoodleModal
            isOpen={isDoodleOpen}
            onClose={() => setIsDoodleOpen(false)}
            onSend={handleFileUpload}
          />

        </div>

        {/* Info Panel rendered conditionally */}
        {showInfoPanel && (
          <InfoPanel onClose={() => setShowInfoPanel(false)} onSearch={(query) => console.log('Searching for:', query)} />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;

