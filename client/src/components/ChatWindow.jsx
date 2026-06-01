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
  ChevronRight
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
    loading
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

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom on fresh messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (currentChat) {
      setFetchingMessages(true);
      fetchSmartReplies();
      setReplyingTo(null);
      setInput('');
      setSelectedFile(null);
      
      // Beautiful skeleton loader delay for 500ms to visually represent channel decryption
      const loaderTimer = setTimeout(() => {
        setFetchingMessages(false);
      }, 500);
      return () => clearTimeout(loaderTimer);
    }
  }, [currentChat, messages.length]);

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
    showToast(`Gemini is rewriting your draft (${tone})...`, 'info');
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
        <div className="input-row">
          {/* Paperclip upload trigger */}
          <button className="icon-btn" title="Attach Media" onClick={() => fileInputRef.current?.click()} disabled={isRecording}>
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
                placeholder={isRecording ? `Recording... (${formatSeconds(recordingTime)})` : "Type a message..."}
                value={isRecording ? '' : input}
                onChange={handleInputChange}
                disabled={isRecording}
                required={!selectedFile}
              />
              <div className="textbox-actions" style={{ display: isRecording ? 'none' : 'flex' }}>
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
                    Gemini Tone Rewrite
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
          {input.trim() || selectedFile ? (
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
      </div>
      
      {/* Keyframes inject for audio recorder pulsing */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
