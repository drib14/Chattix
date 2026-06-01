import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ChatFeedSkeleton } from './SkeletonLoader';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Pin,
  X,
  FileText,
  ArrowLeft,
  ChevronRight,
  Info,
  Phone,
  Video,
  User,
  Shield,
  Ban,
  Download,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ className = '', onBack }) {
  const {
    user,
    currentChat,
    messages,
    sendMessage,
    sendMediaMessage,
    sendTypingStatus,
    typingUsers,
    onlineUsers,
    showToast,
    loading,
    updateGroupPermissions,
    fetchInviteLink,
    createPoll,
    fetchGroupFiles,
    updateConversationCustomization,
    blockUser,
    unblockUser,
    blockedUsers
  } = useApp();

  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Message object
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
  
  // Custom message switcher skeleton loading delay
  const [fetchingMessages, setFetchingMessages] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const recordingIntervalRef = useRef(null);

  // File attachments state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('image'); // image, video, file, voice
  
  // Unified Right Details Sidebar Drawer
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('settings'); // settings
  const [accordionOpen, setAccordionOpen] = useState({
    info: true,
    customize: false,
    media: false,
    privacy: false
  });
  
  const [groupFilesList, setGroupFilesList] = useState([]);
  const [inviteTokenVal, setInviteTokenVal] = useState('');
  
  // Group Poll creator states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Local sync toggles for group permissions
  const [announcementsOnly, setAnnouncementsOnly] = useState(false);
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [allowMemberPins, setAllowMemberPins] = useState(true);

  // Load right sidebar details when toggled
  useEffect(() => {
    if (showRightSidebar && currentChat) {
      // Load shared media files
      const loadFiles = async () => {
        const res = await fetchGroupFiles(currentChat._id);
        if (res?.success) {
          setGroupFilesList(res.files);
        }
      };
      loadFiles();

      // Load group specific settings
      if (currentChat.isGroup) {
        const loadInvite = async () => {
          const res = await fetchInviteLink(currentChat._id);
          if (res?.success) setInviteTokenVal(res.inviteToken);
        };
        loadInvite();
        
        // Sync local checkboxes
        setAnnouncementsOnly(currentChat.groupPermissions?.announcementsOnly || false);
        setAllowMemberInvites(currentChat.groupPermissions?.allowMemberInvites !== false);
        setAllowMemberPins(currentChat.groupPermissions?.allowMemberPins !== false);
      }
    }
  }, [showRightSidebar, currentChat?._id]);

  const toggleAccordion = (section) => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleUpdatePermissions = async (ann, inv, pin) => {
    const res = await updateGroupPermissions(currentChat._id, ann, inv, pin);
    if (res?.success) {
      setAnnouncementsOnly(ann);
      setAllowMemberInvites(inv);
      setAllowMemberPins(pin);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const filteredOpts = pollOptions.filter(o => o.trim() !== '');
    if (!pollQuestion.trim() || filteredOpts.length < 2) {
      showToast('Please specify a question and at least 2 options.', 'error');
      return;
    }
    const res = await createPoll(currentChat._id, pollQuestion, filteredOpts);
    if (res?.success) {
      showToast('Poll created successfully!', 'success');
      setPollQuestion('');
      setPollOptions(['', '']);
      // Re-trigger load shared files or settings
      toggleAccordion('info');
    } else {
      showToast('Failed to create group poll.', 'error');
    }
  };

  const handleAddPollOptionField = () => {
    if (pollOptions.length >= 6) return;
    setPollOptions(prev => [...prev, '']);
  };

  const handlePollOptionChange = (idx, val) => {
    setPollOptions(prev => prev.map((o, i) => i === idx ? val : o));
  };

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom on fresh messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Triggered when active conversation room changes
  useEffect(() => {
    if (currentChat) {
      setFetchingMessages(true);
      setReplyingTo(null);
      setInput('');
      setSelectedFile(null);
      
      const loaderTimer = setTimeout(() => {
        setFetchingMessages(false);
      }, 350);
      return () => clearTimeout(loaderTimer);
    }
  }, [currentChat?._id]);

  // Triggered when messages are received or sent
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle typing status updates
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Emit typing status
    sendTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  // Submit Text Message
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    if (selectedFile) {
      await sendMediaMessage(selectedFile, fileType, replyingTo?._id);
      setSelectedFile(null);
    } else {
      await sendMessage(input, replyingTo?._id);
      setInput('');
    }
    
    setReplyingTo(null);
    sendTypingStatus(false);
  };

  // Instantly quick-send active emoji
  const handleQuickEmojiSend = async () => {
    const emojiToSend = currentChat?.themeEmoji || '👍';
    await sendMessage(emojiToSend, replyingTo?._id);
    setReplyingTo(null);
  };

  // Custom theme colors helper
  const getThemeColor = () => {
    switch (currentChat?.themeColor) {
      case 'blue': return '#0084ff';
      case 'pink': return '#ff007f';
      case 'orange': return '#ff5e36';
      case 'green': return '#00b060';
      case 'purple':
      default:
        return '#a855f7';
    }
  };

  const getThemeGradient = () => {
    switch (currentChat?.themeColor) {
      case 'blue': return 'linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)';
      case 'pink': return 'linear-gradient(135deg, #ff007f 0%, #ff80df 100%)';
      case 'orange': return 'linear-gradient(135deg, #ff5e36 0%, #ffaa00 100%)';
      case 'green': return 'linear-gradient(135deg, #00b060 0%, #00e0a0 100%)';
      case 'purple':
      default:
        return 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)';
    }
  };

  // File selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      setFileType('image');
    } else if (file.type.startsWith('video/')) {
      setFileType('video');
    } else if (file.type.startsWith('audio/')) {
      setFileType('voice');
    } else {
      setFileType('file');
    }
  };

  // Start Mic Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      let chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
        
        showToast('Uploading voice note to Cloudinary...', 'info');
        await sendMediaMessage(audioFile, 'voice');
        showToast('Voice note sent!', 'success');
        setAudioChunks([]);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      showToast('Recording voice note...', 'info');
    } catch (error) {
      console.error(error);
      showToast('Failed to access microphone.', 'error');
    }
  };

  // Stop Mic Voice Recording and Save
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleEmojiClick = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiDrawer(false);
  };

  if (!currentChat) {
    return (
      <div className={`chat-window glass-panel ${className}`}>
        <div className="chat-empty">
          <div className="chat-empty-logo" style={{ width: '80px', height: '80px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
            <Logo size={48} />
          </div>
          <h2 style={{ fontSize: '22px', background: 'linear-gradient(135deg, #ffffff 40%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Chattix Secure Engine
          </h2>
          <p style={{ maxWidth: '320px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Choose a conversation from the active chats list or click the "Add Contact" or "Group" keys in the sidebar header to begin secure, real-time messaging.
          </p>
        </div>
      </div>
    );
  }

  // Header & Profile Details
  const isGroup = currentChat.isGroup;
  let chatName = 'Chattix Room';
  let statusText = 'Offline';
  let isOnline = false;
  let chatPhoto = '';
  let fallback = 'CR';
  let recipientUser = null;

  if (isGroup) {
    chatName = currentChat.name;
    statusText = `${currentChat.participants.length} participants`;
    chatPhoto = currentChat.avatar;
    fallback = currentChat.name.substring(0, 2);
  } else {
    recipientUser = currentChat.participants.find((p) => p._id !== user.id);
    chatName = recipientUser?.username || 'Chattix User';
    chatPhoto = recipientUser?.profilePhoto;
    fallback = (recipientUser?.username || 'CU').substring(0, 2);
    isOnline = onlineUsers.includes(recipientUser?._id);
    statusText = isOnline ? 'Active Now' : recipientUser?.lastSeen ? `Last active ${new Date(recipientUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline';
  }

  const roomTypers = typingUsers[currentChat._id] || [];
  const otherTypers = roomTypers.filter((u) => u !== user.username);
  const typingIndicatorText = otherTypers.length > 0 ? `${otherTypers.join(', ')} is typing...` : '';

  const isUserBlocked = recipientUser && blockedUsers?.some(u => u._id === recipientUser._id);

  return (
    <div className={`chat-layout-container ${className}`} style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', gap: '16px' }}>
      
      {/* MAIN CHAT WINDOW CONTAINER */}
      <div className="chat-window glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        
        {/* HEADER BAR */}
        <div className="chat-header" style={{ borderBottom: '1px solid var(--glass-border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="chat-header-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar-wrapper" style={{ width: '38px', height: '38px', position: 'relative' }}>
              {chatPhoto ? (
                <img className="avatar" src={chatPhoto} alt={chatName} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="avatar-placeholder" style={{ fontSize: '13px', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fallback}</div>
              )}
              <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{chatName}</h3>
              {typingIndicatorText ? (
                <div className="typing-wave">
                  <span className="typing-text" style={{ fontSize: '10px' }}>{typingIndicatorText}</span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              ) : (
                <span style={{ fontSize: '10.5px', color: isOnline ? 'var(--status-online)' : 'var(--text-muted)', fontWeight: isOnline ? '500' : 'normal' }}>
                  {statusText}
                </span>
              )}
            </div>
          </div>

          {/* Messenger Call and Info Actions */}
          <div className="chat-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="icon-btn" title="Start Audio Call (Aesthetic)" style={{ opacity: 0.45, cursor: 'not-allowed' }}>
              <Phone size={16} />
            </button>
            <button className="icon-btn" title="Start Video Call (Aesthetic)" style={{ opacity: 0.45, cursor: 'not-allowed' }}>
              <Video size={16} />
            </button>
            <button
              className="icon-btn"
              style={{ color: showRightSidebar ? 'var(--accent-purple)' : 'var(--text-secondary)' }}
              title="Toggle Chat Details"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* MESSAGE FEED OR SKELETON */}
        {fetchingMessages ? (
          <ChatFeedSkeleton />
        ) : (
          <div className="message-feed" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '13px' }}>
                This is the start of your secure conversation thread.<br />Messages are protected with session guards.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  index={idx}
                  messages={messages}
                  onReply={() => setReplyingTo(msg)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* INPUT PANEL CONSOLE */}
        <div className="chat-input-area" style={{ padding: '16px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Reply Quote Banner */}
          {replyingTo && (
            <div className="input-quote-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '12px' }}>
              <div>
                <span style={{ fontWeight: '600', color: getThemeColor() }}>
                  Replying to @{replyingTo.sender.username}:
                </span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
                </span>
              </div>
              <button className="icon-btn" style={{ width: '20px', height: '20px' }} onClick={() => setReplyingTo(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Selected Attachment Banner */}
          {selectedFile && (
            <div className="input-attachments-preview">
              <div className="input-attachment-chip" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '16px', gap: '6px', fontSize: '12px' }}>
                <FileText size={14} style={{ color: getThemeColor() }} />
                <span>{selectedFile.name.substring(0, 20)}</span>
                <button className="icon-btn" style={{ width: '16px', height: '16px', marginLeft: '6px' }} onClick={() => setSelectedFile(null)}>
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {(() => {
            const isAdminOfGroup = isGroup && currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id);
            const isMessageLocked = isGroup && currentChat.groupPermissions?.announcementsOnly && !isAdminOfGroup;

            return (
              <div className="input-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                {/* Paperclip upload trigger */}
                <button
                  className="icon-btn"
                  title="Attach Media"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isMessageLocked}
                  style={{ opacity: isMessageLocked ? 0.3 : 1, width: '38px', height: '38px', flexShrink: 0 }}
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />

                {/* Microphone Voice Recorder (Messenger standard is placing next to clip) */}
                <button
                  className={`icon-btn ${isRecording ? 'recording' : ''}`}
                  style={{
                    width: '38px',
                    height: '38px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: isRecording ? '#ef4444' : 'transparent',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                  disabled={isMessageLocked}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                >
                  <Mic size={18} style={{ color: isRecording ? 'white' : 'var(--text-secondary)' }} />
                </button>

                {/* Textbox input */}
                <div className="chat-textbox" style={{ flex: 1, position: 'relative' }}>
                  <form onSubmit={handleSend} style={{ display: 'flex', width: '100%' }}>
                    <input
                      className="glass-input"
                      type="text"
                      placeholder={
                        isMessageLocked
                          ? "Only group admins can send messages here."
                          : isRecording
                          ? `Recording... (${formatSeconds(recordingTime)})`
                          : "Type a message..."
                      }
                      value={isRecording ? '' : input}
                      onChange={handleInputChange}
                      disabled={isRecording || isMessageLocked}
                      style={{ width: '100%', borderRadius: '24px', paddingRight: '40px' }}
                      required={!selectedFile}
                    />
                    <div className="textbox-actions" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: (isRecording || isMessageLocked) ? 'none' : 'flex', alignItems: 'center' }}>
                      {/* Emoji Drawer trigger */}
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: '28px', height: '28px' }}
                        onClick={() => setShowEmojiDrawer(!showEmojiDrawer)}
                        title="Emoji Drawer"
                      >
                        <Smile size={16} />
                      </button>
                    </div>

                    {/* Emoji Drawer Box */}
                    {showEmojiDrawer && (
                      <div className="emoji-drawer" style={{ bottom: '50px', right: '0' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>
                          Quick Emojis
                        </div>
                        <div className="emoji-grid">
                          {['😀', '😂', '🔥', '🚀', '✨', '👍', '🙏', '❤️', '🎉', '💡', '🤔', '👀', '💯', '👏', '🎨', '💻', '⚡', '☕', '🌟', '💥', '🍕', '🙌', '😎', '😜'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="emoji-btn"
                              onClick={() => handleEmojiClick(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Right Action: Send Icon or customizable Empty-Input Emoji Reaction (Messenger empty input thumbs up behavior) */}
                {isMessageLocked ? (
                  <button
                    className="btn-secondary"
                    disabled
                    style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, minWidth: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}
                  >
                    <Send size={16} />
                  </button>
                ) : (input.trim() || selectedFile) ? (
                  <button
                    className="btn-primary"
                    style={{
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '42px',
                      background: getThemeGradient(),
                      boxShadow: 'none'
                    }}
                    onClick={handleSend}
                    disabled={loading}
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    className="icon-btn"
                    style={{
                      borderRadius: '50%',
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '42px',
                      fontSize: '20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer'
                    }}
                    onClick={handleQuickEmojiSend}
                    title="Send Quick Emoji"
                  >
                    {currentChat?.themeEmoji || '👍'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* RIGHT SIDEBAR DETAILS CONSOLE Accordion (Messenger replication details drawer) */}
      {showRightSidebar && (
        <div
          className="glass-panel"
          style={{
            width: '320px',
            height: '100%',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideInRight 0.25s ease-out',
            flexShrink: 0
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Details</h4>
            <button className="icon-btn" onClick={() => setShowRightSidebar(false)}><X size={16} /></button>
          </div>

          {/* Scrollable details shelf */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: '20px' }}>
            
            {/* Center avatar segment */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="avatar-wrapper" style={{ width: '70px', height: '70px' }}>
                {chatPhoto ? (
                  <img className="avatar" src={chatPhoto} alt={chatName} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover', border: `2.5px solid ${getThemeColor()}` }} />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '24px', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fallback}</div>
                )}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: 'white' }}>{chatName}</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{statusText}</span>
            </div>

            {/* Collapsible Options Accordions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* SECTION 1: CHAT INFO */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  onClick={() => toggleAccordion('info')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} style={{ color: getThemeColor() }} /> Chat Info
                  </span>
                  <ChevronRight size={14} style={{ transform: accordionOpen.info ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
                
                {accordionOpen.info && (
                  <div style={{ padding: '4px 8px 12px 8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
                    {isGroup ? (
                      <>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Group Members ({currentChat.participants.length})</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                          {currentChat.participants.map(p => {
                            const isAdm = currentChat.admins?.some(adminId => adminId.toString() === p._id || adminId === p._id);
                            return (
                              <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                                <span style={{ fontSize: '11.5px' }}>@{p.username}</span>
                                {isAdm && <span style={{ fontSize: '9px', background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Admin</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <strong>Bio status:</strong> {recipientUser?.statusText || 'Available'}
                        </div>
                        <div>
                          <strong>Email:</strong> {recipientUser?.email || 'N/A'}
                        </div>
                        <div>
                          <strong>Role:</strong> {recipientUser?.isAdmin ? 'System Administrator' : 'Standard Account'}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: CUSTOMIZE CHAT (Messenger dynamic selector) */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  onClick={() => toggleAccordion('customize')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smile size={15} style={{ color: getThemeColor() }} /> Customize Chat
                  </span>
                  <ChevronRight size={14} style={{ transform: accordionOpen.customize ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
                
                {accordionOpen.customize && (
                  <div style={{ padding: '4px 8px 12px 8px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s' }}>
                    
                    {/* Theme pickers */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Chat Custom Theme</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { key: 'purple', color: '#a855f7' },
                          { key: 'blue', color: '#0084ff' },
                          { key: 'pink', color: '#ff007f' },
                          { key: 'orange', color: '#ff5e36' },
                          { key: 'green', color: '#00b060' }
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => updateConversationCustomization(currentChat._id, t.key, currentChat.themeEmoji || '👍')}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: t.color,
                              border: currentChat?.themeColor === t.key ? '2px solid white' : 'none',
                              cursor: 'pointer',
                              boxShadow: currentChat?.themeColor === t.key ? '0 0 8px rgba(255,255,255,0.6)' : 'none'
                            }}
                            title={`${t.key} Theme`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Emoji pickers */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Quick Reaction Emoji</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['👍', '❤️', '😂', '🔥', '😮', '💯', '💥', '✨'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => updateConversationCustomization(currentChat._id, currentChat.themeColor || 'purple', emoji)}
                            style={{
                              background: currentChat?.themeEmoji === emoji ? 'rgba(255,255,255,0.1)' : 'transparent',
                              border: currentChat?.themeEmoji === emoji ? '1px solid white' : '1px solid transparent',
                              fontSize: '16px',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                            title={`Select ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: MEDIA, FILES AND LINKS locker */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  onClick={() => toggleAccordion('media')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen size={15} style={{ color: getThemeColor() }} /> Media, Files & Links
                  </span>
                  <ChevronRight size={14} style={{ transform: accordionOpen.media ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
                
                {accordionOpen.media && (
                  <div style={{ padding: '4px 8px 12px 8px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
                    {groupFilesList.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', display: 'block', padding: '10px 0' }}>No attachments found in this conversation.</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {groupFilesList.map((f) => (
                          <a
                            key={f._id}
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                          >
                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={12} style={{ color: getThemeColor() }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fileName || 'Attachment'}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 4: PRIVACY & SUPPORT (Mute, Block/Unblock, Group Permissions) */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  onClick={() => toggleAccordion('privacy')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} style={{ color: getThemeColor() }} /> Privacy & Support
                  </span>
                  <ChevronRight size={14} style={{ transform: accordionOpen.privacy ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
                
                {accordionOpen.privacy && (
                  <div style={{ padding: '4px 8px 12px 8px', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.2s' }}>
                    
                    {/* Simulated Mute */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                      <span>Mute Notifications</span>
                      <input
                        type="checkbox"
                        style={{ accentColor: getThemeColor() }}
                        onChange={(e) => showToast(e.target.checked ? 'Conversation muted.' : 'Conversation unmuted.', 'info')}
                      />
                    </label>

                    {/* Group Admin Permissions settings nested under privacy for groups */}
                    {isGroup && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Group Permissions</span>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                          <span>Admins Only Announcements</span>
                          <input
                            type="checkbox"
                            checked={announcementsOnly}
                            disabled={!currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id)}
                            onChange={(e) => handleUpdatePermissions(e.target.checked, allowMemberInvites, allowMemberPins)}
                            style={{ accentColor: getThemeColor() }}
                          />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                          <span>Allow Member Invites</span>
                          <input
                            type="checkbox"
                            checked={allowMemberInvites}
                            disabled={!currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id)}
                            onChange={(e) => handleUpdatePermissions(announcementsOnly, e.target.checked, allowMemberPins)}
                            style={{ accentColor: getThemeColor() }}
                          />
                        </label>
                      </div>
                    )}

                    {/* Block / Unblock Contact (for 1-to-1 chats) */}
                    {!isGroup && recipientUser && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '4px' }}>
                        {isUserBlocked ? (
                          <button
                            className="btn-secondary"
                            onClick={() => unblockUser(recipientUser._id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontSize: '12px', padding: '8px' }}
                          >
                            <CheckCheck size={14} /> Unblock Contact
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={() => blockUser(recipientUser._id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid #ef4444', color: '#ef4444', fontSize: '12px', padding: '8px' }}
                          >
                            <Ban size={14} /> Block Contact
                          </button>
                        )}
                      </div>
                    )}

                    {/* Simulated Mute */}
                    {isGroup && (
                      <button
                        className="btn-secondary"
                        onClick={() => showToast('Leaving group simulated successfully.', 'success')}
                        style={{ width: '100%', border: '1px solid #ef4444', color: '#ef4444', fontSize: '11.5px', padding: '6px' }}
                      >
                        Leave Group Chat
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Poll creator (Only for groups) */}
            {isGroup && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                <h5 style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={13} color={getThemeColor()} /> Launch Group Poll</h5>
                <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Poll Question"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    required
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                  />
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      className="glass-input"
                      type="text"
                      placeholder={`Choice ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      required={idx < 2}
                      style={{ padding: '5px 8px', fontSize: '11px' }}
                    />
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={handleAddPollOptionField}
                      style={{ padding: '4px 8px', fontSize: '9.5px', border: '1px dashed rgba(255,255,255,0.2)' }}
                    >
                      + Add Choice Option
                    </button>
                  )}
                  <button className="btn-primary" type="submit" style={{ padding: '6px', fontSize: '11px', background: getThemeGradient(), boxShadow: 'none' }}>Launch Poll</button>
                </form>
              </div>
            )}

            {/* Share Group Invite Link */}
            {isGroup && inviteTokenVal && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
                <h5 style={{ fontSize: '12px', margin: '0 0 6px 0', fontWeight: 'bold' }}>🔗 Group Invite Link</h5>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    className="glass-input"
                    type="text"
                    readOnly
                    value={`${window.location.origin}/invite/${inviteTokenVal}`}
                    style={{ padding: '4px 8px', fontSize: '10.5px', background: 'rgba(0,0,0,0.2)', flex: 1 }}
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: '4px 8px', fontSize: '9.5px', background: getThemeGradient(), boxShadow: 'none' }}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteTokenVal}`);
                      showToast('Invite link copied!', 'success');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Spacers & keyframe animations inject */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
