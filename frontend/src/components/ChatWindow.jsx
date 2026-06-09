import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
  Send, Smile, Info, Image, Mic, Square, X, Search, ArrowLeft, BarChart3, Paperclip, MoreVertical
} from 'lucide-react';
import ChatBubble from './ChatBubble';
import ForwardModal from './ForwardModal';
import CreatePollModal from './CreatePollModal';
import MediaModal from './MediaModal';
import ConfirmModal from './ConfirmModal';
import ReportModal from './ReportModal';
import socketService from '../services/socket';
import { userService } from '../services/userService';
import { t } from '../utils/translations';
import { messageService } from '../services/messageService';
import { groupService } from '../services/groupService';
import { friendService } from '../services/friendService';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import {
  addMessage,
  setMessages,
  updateMessage,
  updateRecentChat,
  clearUnread,
  setReplyTo,
  removeMessage,
} from '../redux/slices/chatSlice';
import toast from 'react-hot-toast';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY);

const ChatWindow = ({ onToggleProfile, onBack, showBack, onGroupInfoClick }) => {
  const { selectedChat, messages, onlineUsers, replyTo } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.theme);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [chatStatusText, setChatStatusText] = useState('');
  const [showPollModal, setShowPollModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionResults, setMentionResults] = useState([]);
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localBlocked, setLocalBlocked] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const typingTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  const gifRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const dispatch = useDispatch();

  const fetchGifs = useCallback((offset) => {
    if (gifSearch) {
      return gf.search(gifSearch, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
  }, [gifSearch]);

  const activeChat = selectedChat;
  const isGroup = activeChat?.isGroup || false;
  
  useEffect(() => {
    if (activeChat?._id && !isGroup) {
      userService.getBlockedUsers().then(users => {
        const blocked = users.some(b => (b._id || b).toString() === activeChat._id.toString());
        setLocalBlocked(blocked);
      }).catch(() => {});
    } else {
      setLocalBlocked(null);
    }
  }, [activeChat?._id, isGroup]);

  const isBlockedByMe = localBlocked !== null ? localBlocked : !!activeChat?.isBlockedByMe;

  const isRequestChat = () => {
    if (!activeChat || isGroup) return false;
    const isFriend = user?.friends?.some((f) => f._id === activeChat._id || f === activeChat._id);
    if (isFriend) return false;
    // Check if the last message in this conversation was NOT sent by the current user
    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const amISender = lastMsg?.sender?._id === user?._id || lastMsg?.sender === user?._id;
    return !amISender;
  };


  const handleBlockUser = async () => {
    try {
      if (isBlockedByMe) {
        await userService.unblockUser(activeChat._id);
        setLocalBlocked(false);
        toast.success(`Unblocked ${activeChat.fullName || activeChat.groupName}`);
      } else {
        await userService.blockUser(activeChat._id);
        setLocalBlocked(true);
        toast.success(`Blocked ${activeChat.fullName || activeChat.groupName}`);
      }
      setShowBlockConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteConversation = async () => {
    try {
      await messageService.deleteConversation(activeChat._id);
      toast.success('Conversation deleted');
      dispatch(setSelectedChat(null));
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  const handleAddFriend = async () => {
    try {
      // It might be a request we are accepting or a new request we are sending. 
      // The easiest way is to just send a request; if they already sent one to us, the backend usually accepts it.
      await friendService.sendFriendRequest(activeChat._id);
      toast.success('Friend request sent/accepted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add friend');
    }
  };

  const handleReportUser = async (reportData) => {
    try {
      await userService.reportUser(activeChat._id, reportData);
      toast.success('Report submitted successfully');
      setShowReportModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Report failed');
    }
  };

  const displayedMessages = Array.isArray(messages) ? messages : [];
  const chatId = activeChat?._id?.toString();
  const isOnline = onlineUsers.some((u) => {
    const uid = typeof u === 'object' && u !== null ? u.userId : u;
    return uid?.toString() === chatId;
  });

  const isGroupAdmin = isGroup && (
    activeChat?.admin?._id?.toString() === user?._id?.toString() ||
    activeChat?.admins?.some((admin) => admin?._id?.toString() === user?._id?.toString())
  );
  const announcementModeActive = isGroup && groupInfo?.announcementMode;
  const canSendGroupMessage = !announcementModeActive || isGroupAdmin;

  const scrollToMessage = (messageId) => {
    const node = messageRefs.current[messageId];
    if (node?.scrollIntoView) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const updateTypingUsers = (username, typing) => {
    setTypingUsers((prev) => {
      if (!username) return prev;
      if (typing) {
        return prev.includes(username) ? prev : [...prev, username];
      }
      return prev.filter((name) => name !== username);
    });
  };

  const getTypingLabel = () => {
    if (isGroup) {
      if (typingUsers.length === 0) return null;
      if (typingUsers.length === 1) return `${typingUsers[0]} ${t('typing', language)}`;
      return `${typingUsers.join(', ')} are ${t('typing', language)}`;
    }
    return isTyping ? `${activeChat.fullName?.split(' ')[0] || 'User'} ${t('typing', language)}` : null;
  };

  useEffect(() => {
    if (!isGroup && activeChat?._id) {
      userService.getUserStatus(activeChat._id)
        .then(res => setChatStatusText(res.lastSeenText))
        .catch(() => setChatStatusText(''));
    }
  }, [activeChat?._id, isGroup, isOnline]);

  useEffect(() => {
    let activeGroupId = null;

    if (activeChat?._id) {
      userService.getChatWallpaper(activeChat._id)
        .then(res => {
          if (res.wallpaper === 'custom') {
            setWallpaperUrl(res.customUrl);
          } else if (res.wallpaper === 'default') {
            setWallpaperUrl('');
          } else {
            setWallpaperUrl(res.wallpaper);
          }
        })
        .catch(() => setWallpaperUrl(''));
    }

    if (isGroup && activeChat?._id) {
      socketService.joinRoom(chatId);
      activeGroupId = chatId;
    }

    return () => {
      if (activeGroupId) {
        socketService.leaveRoom(activeGroupId);
      }
      setTypingUsers([]);
    };
  }, [chatId, isGroup]);

  const markUnreadAsSeen = useCallback(
    async (msgs) => {
      if (!Array.isArray(msgs) || !user?._id || isGroup) return;
      const unread = msgs.filter((m) => {
        const receiverId = m.receiver?._id?.toString() || m.receiver?.toString();
        const senderId = m.sender?._id?.toString() || m.sender?.toString();
        return receiverId === user._id.toString() && !m.seen && senderId !== user._id.toString();
      });
      for (const msg of unread) {
        try {
          const updated = await messageService.markAsSeen(msg._id);
          dispatch(updateMessage(updated));
          const senderId = msg.sender?._id || msg.sender;
          if (senderId) {
            socketService.emit('message_seen', { messageId: msg._id, senderId });
          }
        } catch { /* ignore */ }
      }
    },
    [dispatch, user?._id, isGroup]
  );

  const loadMessages = useCallback(async () => {
    if (!activeChat?._id) return;
    setFetchingMessages(true);
    try {
      const data = isGroup
        ? await messageService.getGroupMessages(activeChat._id)
        : await messageService.getMessages(activeChat._id);
      const loaded = Array.isArray(data?.messages) ? data.messages : [];
      dispatch(setMessages(loaded));
      if (!isGroup) {
        dispatch(clearUnread(activeChat._id));
        await markUnreadAsSeen(loaded);
      }
    } catch {
      dispatch(setMessages([]));
    } finally {
      setFetchingMessages(false);
    }
  }, [activeChat?._id, dispatch, markUnreadAsSeen, isGroup]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, isTyping]);

  useEffect(() => {
    if (!isGroup || !activeChat?._id) {
      setGroupInfo(null);
      return;
    }

    let isMounted = true;
    const fetchGroupDetails = async () => {
      setGroupLoading(true);
      try {
        const details = await groupService.getGroupById(activeChat._id);
        if (isMounted) setGroupInfo(details);
      } catch {
        if (isMounted) setGroupInfo(activeChat);
      } finally {
        if (isMounted) setGroupLoading(false);
      }
    };

    fetchGroupDetails();
    return () => { isMounted = false; };
  }, [activeChat?._id, isGroup]);

  useEffect(() => {
    if (!chatId) return;
    const typingHandler = ({ userId, isTyping: typing }) => {
      if (!isGroup && userId?.toString() === chatId) setIsTyping(typing);
    };
    const groupTypingHandler = ({ groupId, userId, username, isTyping: typing }) => {
      if (!isGroup || groupId !== chatId) return;
      if (userId?.toString() === user?._id?.toString()) return;
      updateTypingUsers(username, typing);
    };
    const onUpdated = (msg) => dispatch(updateMessage(msg));
    const onDeleted = ({ messageId }) => dispatch(updateMessage({
      _id: messageId, deletedForEveryone: true, text: 'This message was deleted', attachments: [],
    }));

    socketService.on('user_typing', typingHandler);
    socketService.on('group_typing', groupTypingHandler);
    socketService.on('message_updated', onUpdated);
    const onPinnedMessage = ({ groupId }) => {
      if (groupId !== chatId) return;
      if (activeChat?._id) {
        groupService.getGroupById(activeChat._id).then((details) => setGroupInfo(details)).catch(() => { });
      }
    };

    const onGroupSettings = (group) => {
      if (group?._id?.toString() !== chatId) return;
      setGroupInfo(group);
    };

    const onWallpaperUpdated = (data) => {
      if (data.chatId === chatId) {
        if (data.wallpaper === 'custom') setWallpaperUrl(data.customUrl);
        else if (data.wallpaper === 'default') setWallpaperUrl('');
        else setWallpaperUrl(data.wallpaper);
      }
    };

    socketService.on('message_reaction', onUpdated);
    socketService.on('message_deleted', onDeleted);
    socketService.on('message_delivered', ({ messageId }) => dispatch(updateMessage({ _id: messageId, delivered: true })));
    socketService.on('message_seen', ({ messageId }) => dispatch(updateMessage({ _id: messageId, seen: true, delivered: true })));
    socketService.on('message_pinned', onPinnedMessage);
    socketService.on('group_settings_updated', onGroupSettings);
    socketService.on('wallpaper_updated', onWallpaperUpdated);

    return () => {
      socketService.off('user_typing', typingHandler);
      socketService.off('group_typing', groupTypingHandler);
      socketService.off('message_updated', onUpdated);
      socketService.off('message_reaction', onUpdated);
      socketService.off('message_deleted', onDeleted);
      socketService.off('message_delivered');
      socketService.off('message_seen');
      socketService.off('message_pinned', onPinnedMessage);
      socketService.off('group_settings_updated', onGroupSettings);
      socketService.off('wallpaper_updated', onWallpaperUpdated);
    };
  }, [chatId, dispatch, isGroup, user?._id, activeChat?._id]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
      if (gifRef.current && !gifRef.current.contains(e.target)) setShowGifPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTyping = () => {
    if (!chatId) return;

    if (isGroup) {
      socketService.sendGroupTyping(chatId, true);
    } else {
      socketService.sendTyping(chatId, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isGroup) {
        socketService.sendGroupTyping(chatId, false);
      } else {
        socketService.sendTyping(chatId, false);
      }
    }, 1000);
  };

  const handleMessageChange = async (e) => {
    const val = e.target.value;
    setMessageText(val);
    handleTyping();

    if (isGroup) {
      // Basic mention detection
      const lastWord = val.split(' ').pop();
      if (lastWord.startsWith('@')) {
        const query = lastWord.slice(1);
        setMentionQuery(query);
        try {
          const res = await userService.searchUsersForMentions(query, activeChat._id);
          setMentionResults(res);
        } catch {
          setMentionResults([]);
        }
      } else {
        setMentionQuery(null);
        setMentionResults([]);
      }
    }
  };

  const insertMention = (username) => {
    const words = messageText.split(' ');
    words.pop();
    setMessageText([...words, `@${username} `].join(' '));
    setMentionQuery(null);
    setMentionResults([]);
  };

  const sendPayload = async (text, files, gifUrl = null) => {
    if (announcementModeActive && !canSendGroupMessage) {
      throw new Error('Announcement mode enabled. Only admins can send in this group.');
    }

    const payload = isGroup
      ? { groupId: activeChat._id, text }
      : { receiverId: activeChat._id, text };
    if (replyTo?._id) payload.replyTo = replyTo._id;
    if (gifUrl) payload.gifUrl = gifUrl;

    const newMessage = await messageService.sendMessage(payload, files);
    dispatch(addMessage(newMessage));
    dispatch(updateRecentChat({ userId: activeChat._id, message: newMessage }));
    dispatch(setReplyTo(null));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat?._id) return;
    if (announcementModeActive && !canSendGroupMessage) {
      toast.error('Announcements only: only group admins can send messages here.');
      return;
    }

    setLoading(true);
    const text = messageText.trim();
    setMessageText('');
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    try {
      await sendPayload(text);
    } catch (error) {
      setMessageText(text);
      toast.error(error.response?.data?.message || error.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  const handleSendGif = async (gifUrl) => {
    if (!activeChat?._id) return;
    if (announcementModeActive && !canSendGroupMessage) {
      toast.error('Announcements only: only group admins can send messages here.');
      return;
    }
    setLoading(true);
    setShowGifPicker(false);
    try {
      await sendPayload('', null, gifUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to send GIF');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !activeChat?._id) return;
    setLoading(true);
    try {
      await sendPayload('', files);
      toast.success('File sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        setLoading(true);
        try {
          await sendPayload('🎤 Voice message', [file]);
          toast.success('Voice note sent');
        } catch {
          toast.error('Failed to send voice note');
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await messageService.searchMessages(q, activeChat?._id, isGroup);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  };

  const messageActions = {
    onReply: (msg) => dispatch(setReplyTo(msg)),
    onCopy: (msg) => {
      navigator.clipboard.writeText(msg.text || '');
      toast.success('Copied');
    },
    onReact: async (msg, emoji) => {
      try {
        const updated = await messageService.addReaction(msg._id, emoji);
        dispatch(updateMessage(updated));
      } catch { toast.error('Reaction failed'); }
    },
    onEdit: async (msg) => {
      const text = window.prompt('Edit message', msg.text);
      if (!text?.trim()) return;
      try {
        const updated = await messageService.editMessage(msg._id, text.trim());
        dispatch(updateMessage(updated));
      } catch { toast.error('Edit failed'); }
    },
    onDeleteMe: async (msg) => {
      try {
        await messageService.deleteForMe(msg._id);
        dispatch(removeMessage(msg._id));
      } catch { toast.error('Delete failed'); }
    },
    onDeleteEveryone: async (msg) => {
      try {
        const updated = await messageService.deleteForEveryone(msg._id);
        dispatch(updateMessage(updated));
      } catch { toast.error('Delete failed'); }
    },
    onForward: async (msg) => {
      setForwardMessage(msg);
    },
    onStar: async (msg) => {
      try {
        await messageService.toggleStar(msg._id);
        toast.success('Star updated');
      } catch { toast.error('Star failed'); }
    },
    onPin: async (msg) => {
      try {
        if (isGroup) {
          if (!isGroupAdmin) {
            toast.error('Only group admins can pin messages.');
            return;
          }
          await groupService.pinMessage(activeChat._id, msg._id);
          setGroupInfo((prev) => ({ ...prev, pinnedMessage: msg }));
          dispatch(updateMessage({ _id: msg._id, pinned: true }));
          toast.success('Message pinned to group');
        } else {
          const updated = await messageService.togglePin(msg._id);
          dispatch(updateMessage(updated));
          toast.success('Message pinned');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Pin failed');
      }
    },
    onViewInfo: (msg) => {
      try {
        const info = `From: ${msg.sender?.fullName || 'Unknown'}\nTime: ${new Date(msg.createdAt).toLocaleString()}\nID: ${msg._id}`;
        toast(info, { duration: 6000 });
      } catch {
        toast.error('Failed to show info');
      }
    },
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chattix-chat">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <span className="text-4xl">💬</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">CHATTIX Messaging</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Select a chat or find people to start a conversation.
          </p>
        </div>
      </div>
    );
  }

  const avatarSrc = activeChat.avatar || activeChat.groupAvatar ||
    `${DEFAULT_AVATAR}&name=${encodeURIComponent(activeChat.fullName || activeChat.groupName || 'U')}`;
  const displayName = activeChat.fullName || activeChat.groupName;

  const visibleMessages = searchOpen && searchQuery.length >= 2
    ? searchResults
    : displayedMessages;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-1 px-2 sm:px-3 py-2 bg-chattix-panel border-b border-gray-200 shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {showBack && (
            <button type="button" onClick={onBack} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 lg:hidden shrink-0">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="relative shrink-0 cursor-pointer" onClick={() => isGroup ? onGroupInfoClick?.() : onToggleProfile?.()}>
            <img src={avatarSrc} alt={displayName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
            {!isGroup && isOnline && <div className="absolute bottom-0 right-0 online-indicator" />}
          </div>
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => isGroup ? onGroupInfoClick?.() : onToggleProfile?.()}>
            <h3 className="font-semibold text-gray-900 text-sm truncate">{displayName}</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
              {getTypingLabel() || (isGroup ? `${activeChat.members?.length || 0} members` : (isOnline ? t('online', language) : (chatStatusText || t('offline', language))))}
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0 relative">
          <button type="button" onClick={() => setSearchOpen((v) => !v)} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-600">
            <Search size={18} />
          </button>
          <button type="button" onClick={() => isGroup ? onGroupInfoClick?.() : onToggleProfile?.()} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-600">
            <Info size={18} />
          </button>
          {!isGroup && (
            <button type="button" onClick={() => setHeaderMenuOpen(!headerMenuOpen)} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-600">
              <MoreVertical size={18} />
            </button>
          )}
          
          <AnimatePresence>
            {headerMenuOpen && !isGroup && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHeaderMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
                >
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); setShowBlockConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                  >
                    {isBlockedByMe ? 'Unblock User' : 'Block User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                  >
                    Delete Conversation
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderMenuOpen(false); setShowReportModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left font-medium"
                  >
                    Report User
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {searchOpen && (
        <div className="px-3 py-2 bg-white border-b border-gray-100">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="modern-input text-sm !py-2"
          />
        </div>
      )}

      {isGroup && announcementModeActive && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-sm">
          {isGroupAdmin
            ? 'Announcement mode is active. As an admin, you can still send messages.'
            : 'Announcement mode is active. Only group admins can send messages in this group.'}
        </div>
      )}

      {isGroup && groupInfo?.pinnedMessage && (
        <div className="px-3 py-3 bg-slate-50 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs uppercase tracking-wide text-gray-500">
            <span>Pinned message</span>
            <button
              type="button"
              onClick={() => scrollToMessage(groupInfo.pinnedMessage._id)}
              className="text-chattix-primary hover:text-chattix-secondary"
            >
              Jump to message
            </button>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-gray-100 text-sm text-gray-800">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {groupInfo.pinnedMessage.sender?.fullName || 'Unknown user'}
            </p>
            <p className="mt-1 text-sm text-gray-700 break-words whitespace-pre-wrap">
              {groupInfo.pinnedMessage.text || 'Attachment'}
            </p>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto p-3 chat-bg min-h-0"
        style={wallpaperUrl ? {
          backgroundImage: `url(${wallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'transparent'
        } : {}}
      >
        {fetchingMessages ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <div className="skeleton h-10 w-[min(12rem,75%)] rounded-xl" />
              </div>
            ))}
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {searchOpen ? 'No messages found' : `Say hello to ${displayName}!`}
          </div>
        ) : (
          <AnimatePresence>
            {visibleMessages.map((message, index) => (
              <ChatBubble
                key={message._id || index}
                message={message}
                isOwn={
                  message.sender?._id?.toString() === user?._id?.toString() ||
                  message.sender?.toString?.() === user?._id?.toString()
                }
                isGroup={isGroup}
                index={index}
                messageRef={(el) => {
                  if (el) messageRefs.current[message._id] = el;
                }}
                onScrollToReply={(messageId) => scrollToMessage(messageId)}
                searchQuery={searchQuery}
                onViewMedia={(attachment) => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  setSelectedMedia(attachment);
                  setShowMediaModal(true);
                }}
                {...messageActions}
              />
            ))}
          </AnimatePresence>
        )}
        {isTyping && (
          <div className="flex mt-2">
            <div className="bg-white rounded-2xl px-3 py-2 shadow-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MediaModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} attachment={selectedMedia} />

      {replyTo && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs truncate">
            <span className="font-semibold text-chattix-secondary">Replying to </span>
            {replyTo.text || 'Attachment'}
          </div>
          <button type="button" onClick={() => dispatch(setReplyTo(null))} className="p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {mentionQuery !== null && mentionResults.length > 0 && (
        <div className="absolute bottom-16 left-2 right-2 sm:left-14 sm:right-14 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
          {mentionResults.map((mu) => (
            <button
              key={mu._id}
              type="button"
              onClick={() => insertMention(mu.username)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
            >
              <img src={mu.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{mu.fullName}</p>
                <p className="text-xs text-gray-500">@{mu.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isBlockedByMe ? (
        <div className="px-2 sm:px-3 py-4 bg-chattix-panel border-t border-gray-200 text-center relative shrink-0 safe-bottom">
          <p className="text-sm text-gray-500 mb-3">You blocked this user. Unblock them to interact.</p>
          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <button onClick={() => setShowBlockConfirm(true)} className="flex-1 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Unblock
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-2 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors">
              Delete Conversation
            </button>
          </div>
        </div>
      ) : activeChat?.isBlockingMe ? (
        <div className="px-2 sm:px-3 py-4 bg-chattix-panel border-t border-gray-200 text-center relative shrink-0 safe-bottom">
          <p className="text-sm text-gray-500 mb-3">You have been blocked by this user.</p>
          <div className="flex justify-center">
            <button onClick={() => setShowDeleteConfirm(true)} className="py-2 px-6 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors">
              Delete Conversation
            </button>
          </div>
        </div>
      ) : isRequestChat() ? (
        <div className="px-2 sm:px-3 py-4 bg-chattix-panel border-t border-gray-200 text-center relative shrink-0 safe-bottom">
          <p className="text-sm text-gray-500 mb-3">This is a message request. Reply to accept, or choose an action.</p>
          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <button onClick={handleAddFriend} className="flex-1 py-2 px-4 bg-chattix-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors">
              Add Friend
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-2 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="px-2 sm:px-3 py-2 bg-chattix-panel border-t border-gray-200 relative shrink-0 safe-bottom">
          {showEmojiPicker && (
            <div ref={emojiRef} className="absolute bottom-full left-0 right-0 sm:left-2 sm:right-auto mb-1 z-50 flex justify-center sm:justify-start px-1">
              <div className="max-w-[calc(100vw-0.5rem)] overflow-hidden rounded-xl shadow-lg">
                <EmojiPicker
                  onEmojiClick={(e) => setMessageText((p) => p + e.emoji)}
                  width={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 16 : 320)}
                  height={Math.min(360, typeof window !== 'undefined' ? window.innerHeight * 0.45 : 360)}
                />
              </div>
            </div>
          )}
          {showGifPicker && (
            <div ref={gifRef} className="absolute bottom-full left-0 right-0 sm:left-12 sm:right-auto mb-1 z-50 flex justify-center sm:justify-start px-1">
              <div className="bg-white max-w-[calc(100vw-0.5rem)] overflow-hidden rounded-xl shadow-lg p-2 border border-gray-200 flex flex-col gap-2" style={{ width: 320 }}>
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
                />
                <div className="h-[300px] overflow-y-auto overflow-x-hidden" style={{ width: 300 }}>
                  <Grid
                    key={gifSearch}
                    fetchGifs={fetchGifs}
                    width={300}
                    columns={3}
                    gutter={6}
                    noLink={true}
                    hideAttribution={true}
                    onGifClick={(gif, e) => {
                      e.preventDefault();
                      handleSendGif(gif.images.original.url);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-1 min-w-0">
            <button type="button" onClick={() => { setShowEmojiPicker((v) => !v); setShowGifPicker(false); }} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-500 shrink-0">
              <Smile size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button type="button" onClick={() => { setShowGifPicker((v) => !v); setShowEmojiPicker(false); }} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-500 shrink-0 font-bold text-xs" style={{ minWidth: '36px' }}>
              GIF
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-500 shrink-0" title="Send Photos & Videos">
              <Image size={18} className="sm:w-[19px] sm:h-[19px]" />
            </button>
            <button type="button" onClick={() => docInputRef.current?.click()} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-500 shrink-0" title="Send Documents & Files">
              <Paperclip size={18} className="sm:w-[19px] sm:h-[19px]" />
            </button>
            {isGroup && (
              <button type="button" onClick={() => setShowPollModal(true)} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 text-gray-500 shrink-0">
                <BarChart3 size={17} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileSelect} />
            <input ref={docInputRef} type="file" className="hidden" multiple accept="*" onChange={handleFileSelect} />
            <input
              type="text"
              value={messageText}
              onChange={handleMessageChange}
              placeholder={t('typeMessage', language)}
              className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30"
              disabled={loading}
            />
            {messageText.trim() ? (
              <button type="submit" disabled={loading} className="p-2 sm:p-2.5 rounded-full bg-chattix-primary text-white hover:bg-chattix-primary-dark disabled:opacity-40 shrink-0">
                <Send size={17} />
              </button>
            ) : isRecording ? (
              <button type="button" onClick={stopRecording} className="p-2 sm:p-2.5 rounded-full bg-red-500 text-white animate-pulse shrink-0">
                <Square size={17} />
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="p-2 sm:p-2.5 rounded-full hover:bg-gray-200 text-gray-500 shrink-0">
                <Mic size={18} />
              </button>
            )}
          </form>
        </div>
      )}

      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        groupId={activeChat._id}
      />
      <ForwardModal
        isOpen={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        messageToForward={forwardMessage}
      />
      <ConfirmModal
        isOpen={showBlockConfirm}
        onCancel={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockUser}
        title={isBlockedByMe ? 'Unblock User' : 'Block User'}
        message={isBlockedByMe ? `Are you sure you want to unblock ${displayName}?` : `Are you sure you want to block ${displayName}? They will no longer be able to message you.`}
        confirmText={isBlockedByMe ? 'Unblock' : 'Block'}
        cancelText="Cancel"
        isDanger={!isBlockedByMe}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConversation}
        title={`Delete conversation with ${activeChat?.fullName}?`}
        message="This will delete the conversation for you. The other person will still be able to see it."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleReportUser}
        userName={displayName}
      />
    </div>
  );
};

export default ChatWindow;
