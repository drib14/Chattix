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
  FolderOpen,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Camera,
  UploadCloud,
  PhoneOff,
  MicOff,
  VideoOff,
  Plus,
  Search
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
    blockedUsers,
    token,
    uploadCustomSticker,
    getCustomStickers,
    deleteConversation
  } = useApp();

  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Message object
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState('emojis'); // emojis | stickers | gifs
  const [customStickers, setCustomStickers] = useState([]);
  const [gifSearch, setGifSearch] = useState('');

  // WebRTC Calling state
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video' | null
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [localStream, setLocalStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const audioCtxRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);
  const localVideoRef = useRef(null);
  
  const activeCallTimerRef = useRef(null);
  const callDurationIntervalRef = useRef(null);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // Custom message switcher skeleton loading delay
  const [fetchingMessages, setFetchingMessages] = useState(false);

  const [isConvoMuted, setIsConvoMuted] = useState(false);
  const [isUserRestricted, setIsUserRestricted] = useState(false);

  useEffect(() => {
    if (currentChat) {
      const muted = JSON.parse(localStorage.getItem('chattix_muted_chats') || '[]');
      setIsConvoMuted(muted.includes(currentChat._id));
    }
  }, [currentChat?._id]);

  useEffect(() => {
    if (currentChat && !currentChat.isGroup) {
      const rec = currentChat.participants?.find((p) => p._id !== user?.id);
      if (rec) {
        const restricted = JSON.parse(localStorage.getItem('chattix_restricted_users') || '[]');
        setIsUserRestricted(restricted.includes(rec._id));
        return;
      }
    }
    setIsUserRestricted(false);
  }, [currentChat?._id, user?.id]);

  const handleToggleMute = (checked) => {
    if (!currentChat) return;
    let muted = JSON.parse(localStorage.getItem('chattix_muted_chats') || '[]');
    if (checked) {
      if (!muted.includes(currentChat._id)) {
        muted.push(currentChat._id);
      }
      showToast('Conversation muted.', 'info');
    } else {
      muted = muted.filter(id => id !== currentChat._id);
      showToast('Conversation unmuted.', 'info');
    }
    localStorage.setItem('chattix_muted_chats', JSON.stringify(muted));
    setIsConvoMuted(checked);
  };

  const handleToggleRestrict = () => {
    if (!currentChat || currentChat.isGroup) return;
    const rec = currentChat.participants?.find((p) => p._id !== user?.id);
    if (!rec) return;
    let restricted = JSON.parse(localStorage.getItem('chattix_restricted_users') || '[]');
    const nextVal = !isUserRestricted;
    if (nextVal) {
      if (!restricted.includes(rec._id)) {
        restricted.push(rec._id);
      }
      showToast('Contact restricted.', 'info');
    } else {
      restricted = restricted.filter(id => id !== rec._id);
      showToast('Contact unrestricted.', 'info');
    }
    localStorage.setItem('chattix_restricted_users', JSON.stringify(restricted));
    setIsUserRestricted(nextVal);
  };

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const recordingIntervalRef = useRef(null);

  // WebRTC calling states

  // Procedural audio ringtone chime sequencer
  const startProceduralRingtone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = () => {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(480, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);

        osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.2);
        osc2.frequency.exponentialRampToValueAtTime(480, audioCtx.currentTime + 1.2);

        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.4);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        
        osc1.stop(audioCtx.currentTime + 1.5);
        osc2.stop(audioCtx.currentTime + 1.5);
      };

      playTone();
      const intervalId = setInterval(playTone, 1600);
      return { audioCtx, intervalId };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Start Call handler
  const startCall = async (type) => {
    setActiveCall({ type, status: 'ringing' });
    setCallDuration(0);
    const ringSound = startProceduralRingtone();
    activeCallTimerRef.current = ringSound;

    if (type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.error('Camera stream error:', err);
        showToast('Microphone or Camera access not granted.', 'error');
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error('Audio stream error:', err);
      }
    }

    // Automatically transition to connected after 3.2 seconds
    setTimeout(() => {
      setActiveCall((prev) => {
        if (prev) {
          if (activeCallTimerRef.current) {
            clearInterval(activeCallTimerRef.current.intervalId);
          }
          // Start duration ticking
          callDurationIntervalRef.current = setInterval(() => {
            setCallDuration((d) => d + 1);
          }, 1000);
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 3200);
  };

  // End Call handler
  const endCall = () => {
    if (activeCallTimerRef.current) {
      clearInterval(activeCallTimerRef.current.intervalId);
    }
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current.intervalId);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Log call duration inside database
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const logContent = `${activeCall?.type === 'video' ? 'Video' : 'Voice'} call ended • ${durationLabel}`;
    sendCustomMessageType('call', logContent);

    setActiveCall(null);
    setCallDuration(0);
  };

  // Custom send message helper for stickers & calling logs
  const sendCustomMessageType = async (type, content, fileUrl = '') => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chats/${currentChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          messageType: type,
          fileUrl
        })
      });
      const data = await res.json();
    } catch (e) {
      console.error('Error sending custom message:', e);
    }
  };

  // Sticker tab upload and selection handlers
  useEffect(() => {
    if (user?.stickers) {
      setCustomStickers(user.stickers);
    }
  }, [user?.stickers]);

  const handleStickerSelect = async (url) => {
    await sendCustomMessageType('sticker', 'sticker', url);
    setShowEmojiDrawer(false);
  };

  const handleStickerUploadSubmit = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast('Uploading custom sticker to Cloudinary...', 'info');
    const updated = await uploadCustomSticker(file);
    if (updated) {
      setCustomStickers(updated);
    }
  };

  // Curated default reaction GIFs
  const curatedGifs = [
    { name: 'LOL', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Q1M25rZHpxNm4xbWlreWswOHlkaTBrMWF4MWFxbDRnYjZodjV4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/3o7TKSjRrfIPjei1fG/giphy.gif' },
    { name: 'Wave', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM384ejI2Z2N2czhpaGgwbTZ0ODMwNXZhMXh5amN2bXJrdWZ1ZHk2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/Vbtc9VG51NXYQ/giphy.gif' },
    { name: 'Claps', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3V0ZXR4d3ptNHN1MXhpbTBlczRxaDF1dmc3aHR4czhkZHc2NXA4NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/ZdUnQS4AXEl1AERdil/giphy.gif' },
    { name: 'Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnAxb2szbTNwMHU4MHozM3lyMHlhdDhpNjQxbWxxZ3NodDN6dDZtNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/l3V0lsGtTMSB5YNgA/giphy.gif' },
    { name: 'Shock', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3F1OW1hbG01dHprbjVybmhwb2E2YWw4bThwZ2c5MmU4NGQ2eTh5OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/tfUW2mEH5Cxfa/giphy.gif' },
    { name: 'Happy', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMm9idjd6ZnMxbDRxMmdkMnM0eWtwMG5xcmg4dHd2ZW5zOG5nczU3NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/KFUx0R7pGA2fP7lZsN/giphy.gif' },
    { name: 'Cry', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3RkcmRxNzM3cm05d3NqNnZ2eFZydjF2MDRtOW5hMXZkNXpzZnJkMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Yw/2WxWlkXWI9PgY/giphy.gif' }
  ];

  // Custom wallpaper customization endpoint handler
  const handleUpdateCustomization = async (color, emoji, background, vanish) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chats/${currentChat._id}/customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          themeColor: color,
          themeEmoji: emoji,
          themeBackground: background,
          vanishMode: vanish
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Custom wallpaper resolution helper
  const getFeedBackgroundStyle = () => {
    const bg = currentChat?.themeBackground;
    if (!bg) return { background: 'rgba(255, 255, 255, 0.01)' };
    if (bg.startsWith('http') || bg.startsWith('data:image')) {
      return {
        backgroundImage: `linear-gradient(180deg, rgba(15,17,26,0.7) 0%, rgba(15,17,26,0.85) 100%), url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    switch (bg) {
      case 'gradient-sunset':
        return { background: 'linear-gradient(135deg, rgba(245, 59, 87, 0.12) 0%, rgba(255, 192, 72, 0.12) 100%)' };
      case 'gradient-ocean':
        return { background: 'linear-gradient(135deg, rgba(10, 189, 227, 0.12) 0%, rgba(0, 210, 211, 0.12) 100%)' };
      case 'gradient-forest':
        return { background: 'linear-gradient(135deg, rgba(16, 172, 132, 0.12) 0%, rgba(29, 209, 161, 0.12) 100%)' };
      case 'solid-dark':
        return { background: 'rgba(15, 23, 42, 0.7)' };
      default:
        return { background: 'rgba(255, 255, 255, 0.01)' };
    }
  };

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

  const formatSeconds = (sec) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Play synthesized Electronic Ringtone procedural chimes sequence
  const playProceduralRingtone = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const playPulse = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
      };
      
      playPulse();
      ringtoneIntervalRef.current = setInterval(playPulse, 1600);
    } catch (e) {
      console.error('Failed playing synthesized ringtone:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

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

  useEffect(() => {
    if (currentChat && currentChat.vanishMode) {
      setMessages([]);
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
    const isRestrictedLocal = recipientUser && JSON.parse(localStorage.getItem('chattix_restricted_users') || '[]').includes(recipientUser._id);
    isOnline = onlineUsers.includes(recipientUser?._id) && !isRestrictedLocal;
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

          <div className="chat-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* glowing unread security indicator lock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)' }} title="Secure End-to-End Encrypted Session">
              <Shield size={10} />
              <span>Secure</span>
            </div>
            
            <button
              className="icon-btn"
              title="Start Audio Call"
              onClick={() => startCall('audio')}
              style={{ color: 'var(--accent-cyan)' }}
            >
              <Phone size={16} />
            </button>
            <button
              className="icon-btn"
              title="Start Video Call"
              onClick={() => startCall('video')}
              style={{ color: 'var(--accent-purple)' }}
            >
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

        {fetchingMessages ? (
          <ChatFeedSkeleton />
        ) : (
          <div className="message-feed" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '2px', ...getFeedBackgroundStyle(), transition: 'all 0.3s' }}>
            {currentChat.vanishMode && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '8px 0'
              }}>
                <div style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🕵️</span>
                  <span>Vanish Mode is active. Messages will disappear when you close this chat.</span>
                </div>
              </div>
            )}
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

                    {/* Triple Tab Media Drawer Box */}
                    {showEmojiDrawer && (
                      <div className="emoji-drawer" style={{
                        bottom: '50px',
                        right: '0',
                        width: '280px',
                        height: '310px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}>
                        {/* Drawer Tabs */}
                        <div style={{
                          display: 'flex',
                          borderBottom: '1px solid var(--glass-border)',
                          background: 'rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}>
                          {['emojis', 'stickers', 'gifs'].map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => setMediaDrawerTab(tab)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: mediaDrawerTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                                border: 'none',
                                borderBottom: mediaDrawerTab === tab ? `2px solid ${getThemeColor()}` : '2px solid transparent',
                                color: mediaDrawerTab === tab ? 'white' : 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Drawer Body content depends on mediaDrawerTab */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                          
                          {/* 1. EMOJIS TAB */}
                          {mediaDrawerTab === 'emojis' && (
                            <div className="emoji-grid">
                              {['😀', '😂', '🔥', '🚀', '✨', '👍', '🙏', '❤️', '🎉', '💡', '🤔', '👀', '💯', '👏', '🎨', '💻', '⚡', '☕', '🌟', '💥', '🍕', '🙌', '😎', '😜', '😍', '🥳', '😭', '😡', '😱', '🤫', '😴', '🍀', '🌈', '🍕', '🍩', '🍺'].map((emoji) => (
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
                          )}

                          {/* 2. STICKERS TAB */}
                          {mediaDrawerTab === 'stickers' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              
                              {/* Decals & Upload console */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Animated Decals & Uploads</span>
                                <button
                                  type="button"
                                  onClick={() => customStickerInputRef.current?.click()}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '10px',
                                    background: getThemeGradient(),
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  + Upload File
                                </button>
                                <input
                                  type="file"
                                  ref={customStickerInputRef}
                                  style={{ display: 'none' }}
                                  onChange={handleStickerUploadSubmit}
                                  accept="image/*"
                                />
                              </div>

                              {/* stickers grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                
                                {/* Curated Animated GIFs Decals (Koala, Panda, Fox, Bear) */}
                                {[
                                  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZkODZpejdscWwxaWFibjN4dW5xNHVwcmV1b2M4cmR3cmV1YnF0MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/duRQDpM2fT96g5d003/giphy.gif',
                                  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTRjNzQyOTB0NmdrZndwbTFjdzg4MDRxbDZvYXhldXo3ZmdrcGFnNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l4FGpP4lxGGXdwRyM/giphy.gif',
                                  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWY5bmtsMmN2dzY1a2E3ZHQxOGEwbmtvdmNodWZ1YW44ZWttZWJ4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKoWXm3okO1kg6c/giphy.gif',
                                  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHgydm1hZmgzbG9sNTh6cmQ3ZmJvMWx3OGk4cGF6NWFkNXplNHF4bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/39GAXJJ1Z9xK8/giphy.gif'
                                ].map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="decal"
                                    onClick={() => handleStickerSelect(url)}
                                    style={{
                                      width: '100%',
                                      height: '52px',
                                      objectFit: 'contain',
                                      cursor: 'pointer',
                                      transition: 'transform 0.15s',
                                      background: 'rgba(255,255,255,0.01)',
                                      borderRadius: '4px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  />
                                ))}

                                {/* Custom Uploaded Stickers list */}
                                {customStickers.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="custom sticker"
                                    onClick={() => handleStickerSelect(url)}
                                    style={{
                                      width: '100%',
                                      height: '52px',
                                      objectFit: 'contain',
                                      cursor: 'pointer',
                                      transition: 'transform 0.15s',
                                      background: 'rgba(255,255,255,0.01)',
                                      borderRadius: '4px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  />
                                ))}

                              </div>
                            </div>
                          )}

                          {/* 3. GIFS TAB */}
                          {mediaDrawerTab === 'gifs' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              
                              {/* Simple input query */}
                              <input
                                className="glass-input"
                                type="text"
                                placeholder="Search reaction GIFs..."
                                value={gifQuery}
                                onChange={(e) => setGifQuery(e.target.value)}
                                style={{ padding: '4px 8px', fontSize: '11px', width: '100%' }}
                              />

                              {/* Curated list */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '4px' }}>
                                {curatedGifs
                                  .filter(g => gifQuery === '' || g.name.toLowerCase().includes(gifQuery.toLowerCase()))
                                  .map((gif, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        sendCustomMessageType('image', 'GIF', gif.url);
                                        setShowEmojiDrawer(false);
                                      }}
                                      style={{
                                        position: 'relative',
                                        height: '70px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        backgroundImage: `url(${gif.url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid var(--glass-border)',
                                        transition: 'transform 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      {/* Name overlay */}
                                      <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        padding: '2px',
                                        fontSize: '9px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }}>
                                        {gif.name}
                                      </div>
                                    </div>
                                  ))}
                              </div>

                            </div>
                          )}

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
                            onClick={() => handleUpdateCustomization(t.key, currentChat.themeEmoji || '👍', currentChat.themeBackground || '', currentChat.vanishMode || false)}
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
                            onClick={() => handleUpdateCustomization(currentChat.themeColor || 'purple', emoji, currentChat.themeBackground || '', currentChat.vanishMode || false)}
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

                    {/* Wallpapers presets */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Solid & Gradient Wallpapers</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[
                          { key: '', name: 'Default', bg: 'rgba(255,255,255,0.02)' },
                          { key: 'gradient-sunset', name: 'Sunset', bg: 'linear-gradient(135deg, #f53b57, #ffc048)' },
                          { key: 'gradient-ocean', name: 'Ocean', bg: 'linear-gradient(135deg, #0abde3, #00d2d1)' },
                          { key: 'gradient-forest', name: 'Forest', bg: 'linear-gradient(135deg, #10ac84, #1dd1a1)' },
                          { key: 'solid-dark', name: 'Slate', bg: '#0f172a' }
                        ].map((wp) => (
                          <button
                            key={wp.key}
                            onClick={() => handleUpdateCustomization(currentChat.themeColor || 'purple', currentChat.themeEmoji || '👍', wp.key, currentChat.vanishMode || false)}
                            style={{
                              padding: '4px',
                              height: '28px',
                              borderRadius: '4px',
                              background: wp.bg,
                              border: currentChat?.themeBackground === wp.key ? '1.5px solid white' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              fontSize: '9px',
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {wp.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Wallpaper Image URL */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Custom Image URL Background</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          className="glass-input"
                          type="url"
                          placeholder="https://..."
                          value={customWallpaperUrl}
                          onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                        />
                        <button
                          className="btn-primary"
                          onClick={() => {
                            if (!customWallpaperUrl) return;
                            handleUpdateCustomization(currentChat.themeColor || 'purple', currentChat.themeEmoji || '👍', customWallpaperUrl, currentChat.vanishMode || false);
                            setCustomWallpaperUrl('');
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px', boxShadow: 'none' }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Vanish Mode toggle */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                        <span style={{ fontWeight: '600', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🕵️ Vanish Mode
                        </span>
                        <input
                          type="checkbox"
                          checked={currentChat?.vanishMode || false}
                          onChange={(e) => handleUpdateCustomization(currentChat.themeColor || 'purple', currentChat.themeEmoji || '👍', currentChat.themeBackground || '', e.target.checked)}
                          style={{ accentColor: getThemeColor() }}
                        />
                      </label>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        When enabled, all messages vanish from feed upon next entry.
                      </span>
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
                    
                    {/* Working Mute */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', cursor: 'pointer' }}>
                      <span>Mute Notifications</span>
                      <input
                        type="checkbox"
                        checked={isConvoMuted}
                        style={{ accentColor: getThemeColor() }}
                        onChange={(e) => handleToggleMute(e.target.checked)}
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

                    {/* Restrict / Unrestrict Contact (for 1-to-1 chats) */}
                    {!isGroup && recipientUser && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={handleToggleRestrict}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            border: isUserRestricted ? '1px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.1)',
                            color: isUserRestricted ? 'var(--accent-purple)' : 'var(--text-primary)',
                            fontSize: '12px',
                            padding: '8px'
                          }}
                        >
                          <Shield size={14} /> {isUserRestricted ? 'Unrestrict Contact' : 'Restrict Contact'}
                        </button>
                      </div>
                    )}

                    {/* Block / Unblock Contact (for 1-to-1 chats) */}
                    {!isGroup && recipientUser && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        {isUserBlocked ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => unblockUser(recipientUser._id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontSize: '12px', padding: '8px' }}
                          >
                            <CheckCheck size={14} /> Unblock Contact
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => blockUser(recipientUser._id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid #ef4444', color: '#ef4444', fontSize: '12px', padding: '8px' }}
                          >
                            <Ban size={14} /> Block Contact
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delete Conversation permanently */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to permanently delete this conversation and all its messages? This action cannot be undone.')) {
                            deleteConversation(currentChat._id);
                          }
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          border: '1px solid #ef4444',
                          color: 'white',
                          background: 'rgba(239, 68, 68, 0.15)',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                      >
                        <Trash size={14} /> Delete Conversation
                      </button>
                    </div>

                    {/* Leave Group Chat */}
                    {isGroup && (
                      <button
                        className="btn-secondary"
                        type="button"
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
        @keyframes audioWave {
          0% { height: 10px; }
          100% { height: 50px; }
        }
      `}</style>

      {/* FULLSCREEN CALL OVERLAY SCREEN */}
      {activeCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(30px)',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          
          {/* Header Secure Indicator */}
          <div style={{ position: 'absolute', top: '24px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Shield size={12} />
            <span>Chattix E2EE Encrypted call session</span>
          </div>

          {/* Caller Details & Profile Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', zIndex: 10 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                border: `3px solid ${getThemeColor()}`,
                overflow: 'hidden',
                boxShadow: `0 0 30px ${getThemeColor()}55`,
                animation: activeCall.status === 'ringing' ? 'pulseRinging 1.5s infinite' : 'none'
              }}>
                {chatPhoto ? (
                  <img src={chatPhoto} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: '#3b0764' }}>
                    {fallback}
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="status-indicator online" style={{ position: 'absolute', bottom: '6px', right: '6px', width: '22px', height: '22px', border: '3px solid rgba(15,23,42,1)' }}></div>
            </div>

            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 4px 0' }}>{chatName}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {activeCall.status === 'ringing' ? 'Ringing Chattix secure session...' : `Connected • ${formatSeconds(callDuration)}`}
              </p>
            </div>
          </div>

          {/* Dynamic Feed visual depends on Call Type and Status */}
          {activeCall.status === 'connected' && (
            <div style={{ margin: '40px 0', width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px', position: 'relative' }}>
              {activeCall.type === 'video' ? (
                /* Video Call stream box */
                <div style={{
                  width: '320px',
                  height: '180px',
                  borderRadius: '16px',
                  background: '#000',
                  border: '1.5px solid var(--glass-border)',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                }}>
                  {/* Remote video mockup (Aesthetic user profile placeholder) */}
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isCameraOff ? 0.2 : 0.8 }}>
                    {chatPhoto ? (
                      <img src={chatPhoto} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '18px' }}>Active video feed...</div>
                    )}
                  </div>

                  {/* Local video mirrored PiP feed */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '80px',
                      height: '110px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1.5px solid white',
                      background: '#1e293b',
                      transform: 'scaleX(-1)' // Mirror local feed
                    }}
                  />
                </div>
              ) : (
                /* Audio Call moving CSS Soundwave Bars */
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '60px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1].map((bar, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '4px',
                        height: '20px',
                        background: getThemeColor(),
                        borderRadius: '2px',
                        animation: `soundwavePulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Call Controls block */}
          <div style={{ position: 'absolute', bottom: '48px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Mute button */}
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                showToast(isMuted ? 'Microphone active.' : 'Microphone muted.', 'info');
              }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Red Hangup button */}
            <button
              onClick={endCall}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Hang up call"
            >
              <X size={26} />
            </button>

            {/* Video switch button */}
            {activeCall.type === 'video' && (
              <button
                onClick={() => {
                  setIsCameraOff(!isCameraOff);
                  if (localStream) {
                    localStream.getVideoTracks().forEach(track => track.enabled = isCameraOff);
                  }
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              >
                <Camera size={18} />
              </button>
            )}
          </div>

          <style>{`
            @keyframes pulseRinging {
              0% { box-shadow: 0 0 0 0 ${getThemeColor()}66; }
              70% { box-shadow: 0 0 0 25px ${getThemeColor()}00; }
              100% { box-shadow: 0 0 0 0 ${getThemeColor()}00; }
            }
            @keyframes soundwavePulse {
              0% { height: 10px; opacity: 0.3; }
              100% { height: 50px; opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
