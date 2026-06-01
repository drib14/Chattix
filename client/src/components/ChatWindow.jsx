import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ChatFeedSkeleton } from './SkeletonLoader';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Sparkles,
  Search,
  Pin,
  X,
  Wand2,
  FileText,
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ className = '', onBack, showAISidebar, setShowAISidebar }) {
  const {
    user,
    currentChat,
    messages,
    sendMessage,
    sendMediaMessage,
    sendTypingStatus,
    typingUsers,
    onlineUsers,
    getAISmartReplies,
    writeAssistAPI,
    showToast,
    loading,
    updateGroupPermissions,
    fetchInviteLink,
    createPoll,
    fetchGroupFiles
  } = useApp();

  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Message object
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  
  // Custom message switcher skeleton loading delay
  const [fetchingMessages, setFetchingMessages] = useState(false);

  // Real voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const recordingIntervalRef = useRef(null);

  // File attachments state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('image'); // image, video, file, voice
  
  // AI Writing Assistant states
  const [showToneDropdown, setShowToneDropdown] = useState(false);

  // Group Info Drawer & Actions
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState('settings'); // settings, files, poll
  const [groupFilesList, setGroupFilesList] = useState([]);
  const [inviteTokenVal, setInviteTokenVal] = useState('');
  
  // Group Poll creator states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Local sync toggles for perms
  const [announcementsOnly, setAnnouncementsOnly] = useState(false);
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [allowMemberPins, setAllowMemberPins] = useState(true);

  // Load invite link & group files when drawer mounts
  useEffect(() => {
    if (showGroupDrawer && currentChat && currentChat.isGroup) {
      if (drawerTab === 'files') {
        const loadFiles = async () => {
          const res = await fetchGroupFiles(currentChat._id);
          if (res?.success) setGroupFilesList(res.files);
        };
        loadFiles();
      } else if (drawerTab === 'settings') {
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
  }, [showGroupDrawer, drawerTab, currentChat]);

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
      setDrawerTab('settings'); // swap tab back
    } else {
      showToast('Failed to create group poll.', 'error');
    }
  };

  const handleAddPollOptionField = () => {
    if (pollOptions.length >= 6) return; // limit to 6 options
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
      fetchSmartReplies();
      setReplyingTo(null);
      setInput('');
      setSelectedFile(null);
      
      const loaderTimer = setTimeout(() => {
        setFetchingMessages(false);
      }, 500);
      return () => clearTimeout(loaderTimer);
    }
  }, [currentChat?._id]);

  // Triggered when messages are received or sent
  useEffect(() => {
    scrollToBottom();
    if (currentChat) {
      fetchSmartReplies();
    }
  }, [messages.length]);

  // Fetch AI Smart Replies based on recent context
  const fetchSmartReplies = async () => {
    if (!currentChat) return;
    const res = await getAISmartReplies(currentChat._id);
    if (res.success) {
      setSmartReplies(res.replies);
    }
  };

  // Handle typing status updates
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Emit typing status
    sendTypingStatus(true);

    // Clear previous timeout and start a fresh one to send stop_typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  // Submit Text Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    if (selectedFile) {
      // Send media
      await sendMediaMessage(selectedFile, fileType, replyingTo?._id);
      setSelectedFile(null);
    } else {
      // Send plain text
      await sendMessage(input, replyingTo?._id);
      setInput('');
    }
    
    setReplyingTo(null);
    sendTypingStatus(false);
  };

  // Submit AI Smart Reply instantly
  const handleSmartReplyClick = async (replyText) => {
    await sendMessage(replyText);
    setSmartReplies([]); // clear
  };

  // AI Writing Assistant tones trigger
  const handleWriteAssist = async (tone) => {
    if (!input.trim()) {
      showToast('Please type a draft message first!', 'info');
      return;
    }
    setShowToneDropdown(false);
    showToast(`Chattix AI is rewriting your draft (${tone})...`, 'info');
    const res = await writeAssistAPI(input, tone);
    if (res.success) {
      setInput(res.rewrittenText);
      showToast('Message rewritten successfully!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // File selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Determine attachment type
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
        
        // Optimistically upload recording
        showToast('Uploading voice note to Cloudinary...', 'info');
        await sendMediaMessage(audioFile, 'voice');
        showToast('Voice note sent!', 'success');
        setAudioChunks([]);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start duration counter
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
      // Stop microphone stream tracks to release device hardware
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Format recording seconds (e.g. 0:05)
  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Select emoji
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

  // Header Details
  const isGroup = currentChat.isGroup;
  let chatName = 'Chattix Room';
  let statusText = 'Offline';
  let isOnline = false;
  let chatPhoto = '';
  let fallback = 'CR';

  if (isGroup) {
    chatName = currentChat.name;
    statusText = `${currentChat.participants.length} participants`;
    chatPhoto = currentChat.avatar;
    fallback = currentChat.name.substring(0, 2);
  } else {
    const recipient = currentChat.participants.find((p) => p._id !== user.id);
    chatName = recipient?.username || 'Chattix User';
    chatPhoto = recipient?.profilePhoto;
    fallback = (recipient?.username || 'CU').substring(0, 2);
    isOnline = onlineUsers.includes(recipient?._id);
    statusText = isOnline ? 'Active Online' : recipient?.lastSeen ? `Last active ${new Date(recipient.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline';
  }

  const roomTypers = typingUsers[currentChat._id] || [];
  const otherTypers = roomTypers.filter((u) => u !== user.username);
  const typingIndicatorText = otherTypers.length > 0 ? `${otherTypers.join(', ')} is typing...` : '';

  return (
    <div className={`chat-window glass-panel ${className}`} style={{ position: 'relative' }}>
      {/* HEADER BAR */}
      <div className="chat-header">
        <div className="chat-header-info">
          {/* Back Navigation Arrow on Small Mobile Screens */}
          {onBack && (
            <button
              className="icon-btn"
              onClick={onBack}
              style={{ marginRight: '10px', background: 'rgba(255,255,255,0.03)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Back to Conversations"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          
          <div className="avatar-wrapper" style={{ width: '38px', height: '38px' }}>
            {chatPhoto ? (
              <img className="avatar" src={chatPhoto} alt={chatName} />
            ) : (
              <div className="avatar-placeholder" style={{ fontSize: '13px' }}>{fallback}</div>
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
              <span style={{ fontSize: '10.5px', color: isOnline ? 'var(--status-online)' : 'var(--text-muted)' }}>
                {statusText}
              </span>
            )}
          </div>
        </div>
        <div className="chat-header-actions" style={{ gap: '4px' }}>
          {isGroup && (
            <button
              className="icon-btn"
              style={{ color: showGroupDrawer ? 'var(--accent-purple)' : 'var(--text-secondary)' }}
              title="Group Settings & Info"
              onClick={() => setShowGroupDrawer(!showGroupDrawer)}
            >
              <Info size={16} />
            </button>
          )}
          <button
            className="icon-btn"
            style={{ color: showAISidebar ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
            title="AI Conversation Search"
            onClick={() => setShowAISidebar(true)}
          >
            <Search size={16} />
          </button>
          <button
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'none', borderRadius: '6px' }}
            title="Get AI Thread Summary"
            onClick={() => setShowAISidebar(true)}
          >
            <Sparkles size={11} />
            AI Recap
          </button>
        </div>
      </div>

      {/* MESSAGE FEED OR SKELETON LOADER */}
      {fetchingMessages ? (
        <ChatFeedSkeleton />
      ) : (
        <div className="message-feed">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '13px' }}>
              This is the start of your secure conversation thread.<br />Messages are protected with session guards.
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                onReply={() => setReplyingTo(msg)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* FLOATING ACTION/INPUT AREA */}
      <div className="chat-input-area">
        {/* Reply Quote Banner */}
        {replyingTo && (
          <div className="input-quote-preview">
            <div>
              <span style={{ fontWeight: '600', color: 'var(--accent-purple)' }}>
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
            <div className="input-attachment-chip">
              <FileText size={14} style={{ color: 'var(--accent-purple)' }} />
              <span>{selectedFile.name.substring(0, 20)}</span>
              <button className="icon-btn" style={{ width: '16px', height: '16px', marginLeft: '6px' }} onClick={() => setSelectedFile(null)}>
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* AI Smart Replies Container */}
        {smartReplies.length > 0 && !input && (
          <div className="smart-replies-container">
            {smartReplies.map((reply, idx) => (
              <div
                key={idx}
                className="smart-reply-chip"
                onClick={() => handleSmartReplyClick(reply)}
              >
                {reply}
              </div>
            ))}
          </div>
        )}

        {/* Input Console bar row */}
        {(() => {
          const isAdminOfGroup = currentChat.isGroup && currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id);
          const isMessageLocked = currentChat.isGroup && currentChat.groupPermissions?.announcementsOnly && !isAdminOfGroup;

          return (
            <div className="input-row">
              {/* Paperclip upload trigger */}
              <button
                className="icon-btn"
                title="Attach Media"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isMessageLocked}
                style={{ opacity: isMessageLocked ? 0.3 : 1 }}
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

              {/* Text input area */}
              <div className="chat-textbox">
                <form onSubmit={handleSend} style={{ display: 'flex' }}>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder={
                      isMessageLocked
                        ? "Only group admins can send messages in this channel."
                        : isRecording
                        ? `Recording... (${formatSeconds(recordingTime)})`
                        : "Type a message..."
                    }
                    value={isRecording ? '' : input}
                    onChange={handleInputChange}
                    disabled={isRecording || isMessageLocked}
                    required={!selectedFile}
                  />
                  <div className="textbox-actions" style={{ display: (isRecording || isMessageLocked) ? 'none' : 'flex' }}>
                    {/* AI Writing Assistant Wand */}
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ color: showToneDropdown ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
                      onClick={() => setShowToneDropdown(!showToneDropdown)}
                      title="AI Writing Assistant"
                    >
                      <Wand2 size={16} />
                    </button>
                    {/* Emoji trigger */}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowEmojiDrawer(!showEmojiDrawer)}
                      title="Emoji Drawer"
                    >
                      <Smile size={16} />
                    </button>
                  </div>

                  {/* Wand Tone Dropdown Menu */}
                  {showToneDropdown && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        bottom: '50px',
                        right: '48px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        width: '180px',
                        zIndex: 20,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 8px' }}>
                        Chattix AI Tone Rewrite
                      </div>
                      {['professional', 'casual', 'shorten', 'expand', 'grammar'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="tab-btn"
                          style={{ textAlign: 'left', textTransform: 'capitalize', padding: '6px 8px' }}
                          onClick={() => handleWriteAssist(t)}
                        >
                          ✨ {t === 'grammar' ? 'Grammar Check' : t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emoji Drawer Box */}
                  {showEmojiDrawer && (
                    <div className="emoji-drawer">
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>
                        Quick Emojis
                      </div>
                      <div className="emoji-grid">
                        {['😀', '😂', '🔥', '🚀', '✨', '👍', '🙏', '❤️', '🎉', '💡', '🤔', '👀', '💯', '👏', '🎨', '💻', '⚡', '☕', '🌟', '💥', '🍕', '🎉', '🙌', '😎'].map((emoji) => (
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

              {/* Action Trigger: Send or Microphone Voice Recorder */}
              {isMessageLocked ? (
                <button
                  className="btn-secondary"
                  disabled
                  style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, minWidth: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}
                >
                  <Send size={16} />
                </button>
              ) : input.trim() || selectedFile ? (
                <button className="btn-primary" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', minWidth: '42px', boxShadow: 'none' }} onClick={handleSend} disabled={loading}>
                  <Send size={16} />
                </button>
              ) : (
                <button
                  className={`btn-primary ${isRecording ? 'recording' : ''}`}
                  style={{
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '42px',
                    boxShadow: 'none',
                    background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                >
                  <Mic size={16} style={{ color: 'white' }} />
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* GROUP SETTINGS SLIDE-OVER DRAWER */}
      {showGroupDrawer && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            borderLeft: '1px solid var(--glass-border)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.25s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>Group Console</h4>
            <button className="icon-btn" onClick={() => setShowGroupDrawer(false)}><X size={16} /></button>
          </div>

          {/* Drawer tab triggers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
            <button
              className={`tab-btn ${drawerTab === 'settings' ? 'active' : ''}`}
              style={{ flex: 1, padding: '10px 0', fontSize: '11px', borderRadius: 0 }}
              onClick={() => setDrawerTab('settings')}
            >
              Settings
            </button>
            <button
              className={`tab-btn ${drawerTab === 'files' ? 'active' : ''}`}
              style={{ flex: 1, padding: '10px 0', fontSize: '11px', borderRadius: 0 }}
              onClick={() => setDrawerTab('files')}
            >
              Locker ({groupFilesList.length})
            </button>
            <button
              className={`tab-btn ${drawerTab === 'poll' ? 'active' : ''}`}
              style={{ flex: 1, padding: '10px 0', fontSize: '11px', borderRadius: 0 }}
              onClick={() => setDrawerTab('poll')}
            >
              Create Poll
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            
            {/* DRAWER SETTINGS TAB */}
            {drawerTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Invite Link */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
                  <h5 style={{ fontSize: '12px', margin: '0 0 6px 0', fontWeight: 'bold' }}>🔗 Group Invite Link</h5>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      className="glass-input"
                      type="text"
                      readOnly
                      value={inviteTokenVal ? `${window.location.origin}/invite/${inviteTokenVal}` : 'Generating link...'}
                      style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.2)', flex: 1 }}
                    />
                    <button
                      className="btn-primary"
                      style={{ padding: '4px 8px', fontSize: '10px', boxShadow: 'none' }}
                      onClick={() => {
                        if (!inviteTokenVal) return;
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteTokenVal}`);
                        showToast('Invite link copied to clipboard!', 'success');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Group Permissions (visible to group admins) */}
                <div>
                  <h5 style={{ fontSize: '12px', margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Administrative Locks</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                      <div>
                        <span>Announcement Only</span>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Only admins can send messages</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={announcementsOnly}
                        disabled={!currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id)}
                        onChange={(e) => handleUpdatePermissions(e.target.checked, allowMemberInvites, allowMemberPins)}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                      <div>
                        <span>Allow Member Invites</span>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Allow anyone to generate invite links</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowMemberInvites}
                        disabled={!currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id)}
                        onChange={(e) => handleUpdatePermissions(announcementsOnly, e.target.checked, allowMemberPins)}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                      <div>
                        <span>Allow Member Pins</span>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Allow anyone to pin messages</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowMemberPins}
                        disabled={!currentChat.admins?.some(adminId => adminId.toString() === user.id || adminId === user.id)}
                        onChange={(e) => handleUpdatePermissions(announcementsOnly, allowMemberInvites, e.target.checked)}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Group Participants */}
                <div>
                  <h5 style={{ fontSize: '12px', margin: '0 0 6px 0', color: 'var(--text-secondary)' }}>Group Members ({currentChat.participants.length})</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                    {currentChat.participants.map(p => {
                      const isAdm = currentChat.admins?.some(adminId => adminId.toString() === p._id || adminId === p._id);
                      return (
                        <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                          <span style={{ fontSize: '12px' }}>@{p.username}</span>
                          {isAdm && <span style={{ fontSize: '9px', background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Admin</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER FILES LOCKER TAB */}
            {drawerTab === 'files' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupFilesList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '30px 0' }}>No attachments found in this group chat.</div>
                ) : (
                  groupFilesList.map((f) => (
                    <a
                      key={f._id}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={14} style={{ color: 'var(--accent-cyan)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fileName || 'Attachment'}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Sender: @{f.sender?.username} • {(f.fileSize / 1024).toFixed(1)} KB</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}

            {/* DRAWER CREATE POLL TAB */}
            {drawerTab === 'poll' && (
              <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px' }}>Poll Question</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="e.g. What time is the deploy?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px' }}>Options ({pollOptions.length})</label>
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      className="glass-input"
                      type="text"
                      placeholder={`Choice ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      required={idx < 2}
                    />
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={handleAddPollOptionField}
                      style={{ padding: '6px 12px', fontSize: '10px', marginTop: '4px' }}
                    >
                      + Add Choice Option
                    </button>
                  )}
                </div>

                <button className="btn-primary" type="submit" style={{ marginTop: '10px', padding: '8px' }}>
                  Launch Group Poll
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Keyframes inject for audio recorder pulsing */}
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
      `}</style>
    </div>
  );
}
