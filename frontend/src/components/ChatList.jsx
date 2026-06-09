import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { setSelectedChat, clearUnread, removeRecentChat } from '../redux/slices/chatSlice';
import { userService } from '../services/userService';
import { messageService } from '../services/messageService';
import { t } from '../utils/translations';
import toast from 'react-hot-toast';
import StoryTray from './StoryTray';
import ConfirmModal from './ConfirmModal';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const ChatList = ({ searchQuery = '' }) => {
  const { recentChats, onlineUsers, selectedChat, unreadCounts } = useSelector((state) => state.chat);
  const { language } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);
  const { friends: userFriends } = useSelector((state) => state.friend);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [archivedChats, setArchivedChats] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState('messages');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  useEffect(() => {
    userService.getArchivedChats().then(setArchivedChats).catch(() => {});
    userService.getBlockedUsers().then(setBlockedUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'blocked') {
      userService.getBlockedUsers().then(setBlockedUsers).catch(() => {});
    }
  }, [activeTab]);

  const handleArchive = async (e, chat, isArchived) => {
    e.stopPropagation();
    try {
      if (isArchived) {
        await userService.unarchiveChat(chat._id?._id || chat._id);
        setArchivedChats(prev => prev.filter(c => c.chatId?._id !== (chat._id?._id || chat._id)));
        toast.success(t('unarchiveChat', language));
      } else {
        await userService.archiveChat(chat._id?._id || chat._id);
        const newArchived = await userService.getArchivedChats();
        setArchivedChats(newArchived);
        toast.success(t('archiveChat', language));
      }
      setMenuOpenId(null);
    } catch (error) {
      toast.error('Failed to update archive status');
    }
  };

  const handleDeleteClick = (e, chat) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setShowDeleteConfirm(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete._id?._id || chatToDelete._id;
    try {
      await messageService.deleteConversation(chatId);
      dispatch(removeRecentChat(chatId));
      if (selectedChat?._id === chatId) {
        navigate('/messages');
      }
      toast.success(t('conversationDeleted', language) || 'Conversation deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete conversation');
    } finally {
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return messageDate.toLocaleDateString();
  };

  const formatOfflineTimestamp = (lastSeen) => {
    if (!lastSeen) return '';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const archivedIds = new Set(archivedChats.map(ac => ac.chatId?._id?.toString()));
  const filteredChats = (Array.isArray(recentChats) ? recentChats : []).filter(
    c => !archivedIds.has(c._id?._id?.toString())
  );

  const friendsIds = new Set(
    (Array.isArray(userFriends) ? userFriends : user?.friends || []).map(f => f._id?.toString() || f.toString())
  );
  const myId = user?._id?.toString();

  const isRequestChat = (chat) => {
    if (chat.isGroup) return false;
    const otherUserId = chat._id?._id?.toString() || chat._id?.toString();
    if (friendsIds.has(otherUserId)) return false;
    
    const lastSenderId = chat.lastMessage?.sender?._id?.toString() || chat.lastMessage?.sender?.toString();
    if (lastSenderId && lastSenderId !== myId) {
      return true;
    }
    return false;
  };

  const messagesChats = filteredChats.filter(c => !isRequestChat(c));
  const requestsChats = filteredChats.filter(c => isRequestChat(c));

  const blockedChats = blockedUsers.map(bu => ({
    _id: { ...bu, isBlockedByMe: true },
    lastMessage: null,
    unreadCount: 0,
  }));

  const displayChats = activeTab === 'archived'
    ? (Array.isArray(recentChats) ? recentChats : []).filter(c => archivedIds.has(c._id?._id?.toString()))
    : (activeTab === 'requests' ? requestsChats : (activeTab === 'blocked' ? blockedChats : messagesChats));

  const filteredDisplayChats = displayChats.filter(chat => {
    if (!searchQuery) return true;
    const name = chat._id?.fullName || chat._id?.groupName || chat.groupName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectChat = (chat) => {
    if (chat._id) {
      const targetId = chat._id._id || chat._id;
      if (targetId && typeof targetId === 'string') {
        navigate(`/messages/${targetId}`);
      } else if (targetId && targetId._id) {
        navigate(`/messages/${targetId._id}`);
      }
      dispatch(clearUnread(chat._id._id || chat._id));
    }
  };

  const { groupedStories } = useSelector((state) => state.story);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <StoryTray />
      <div className="flex px-4 py-2 gap-4 border-b border-gray-100 shrink-0">
        <button
          onClick={() => setActiveTab('messages')}
          className={`font-medium text-sm pb-1 border-b-2 transition-colors ${
            activeTab === 'messages' ? 'border-chattix-primary text-chattix-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`font-medium text-sm pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests' ? 'border-chattix-primary text-chattix-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Requests
          {requestsChats.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
              {requestsChats.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`font-medium text-sm pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'archived' ? 'border-chattix-primary text-chattix-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Archived
          {archivedChats.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
              {archivedChats.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`font-medium text-sm pb-1 border-b-2 transition-colors ${
            activeTab === 'blocked' ? 'border-chattix-primary text-chattix-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Blocked
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {filteredDisplayChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-chattix-bg rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">{searchQuery ? 'No results found' : 'No conversations yet'}</p>
            <p className="text-sm text-gray-400 mt-1">{searchQuery ? 'Try a different search term' : 'Start chatting with your friends'}</p>
          </div>
        ) : (
          <div>
            {filteredDisplayChats.map((chat, index) => {
              const chatUser = chat._id;
              const chatId = chatUser?._id?.toString();
              const isOnline = onlineUsers.some((u) => {
                const uid = typeof u === 'object' && u !== null ? u.userId : u;
                return uid?.toString() === chatId;
              });
              const isSelected =
                selectedChat?._id?.toString() === chatId;

              const currentUnread = unreadCounts[chatId] !== undefined ? unreadCounts[chatId] : (chat.unreadCount || 0);

              const userStoryGroup = groupedStories?.find(group => group.user._id === chatId);
              let borderClass = 'border-2 border-transparent';
              if (userStoryGroup) {
                if (userStoryGroup.hasUnviewed) {
                  borderClass = 'p-[2px] bg-gradient-to-tr from-blue-400 to-indigo-600 bg-origin-border';
                } else {
                  borderClass = 'p-[2px] border-2 border-gray-300';
                }
              }

              return (
                <motion.div
                  key={chatId || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative group"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors text-left min-w-0 ${
                      isSelected ? 'bg-chattix-primary/5 border-l-4 border-chattix-primary' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full ${borderClass} cursor-pointer`} onClick={(e) => {
                        if (userStoryGroup) {
                          e.stopPropagation();
                          setSearchParams(prev => { prev.set('story', chatId); return prev; });
                        }
                      }}>
                        <img
                          src={
                            chatUser?.avatar ||
                            `${DEFAULT_AVATAR}&name=${encodeURIComponent(chatUser?.fullName || 'U')}`
                          }
                          alt={chatUser?.fullName}
                          className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                        />
                      </div>
                      {isOnline ? (
                        <div className="absolute bottom-0 right-0 online-indicator border-2 border-white" />
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-gray-200 text-gray-700 text-[9px] font-bold px-1 rounded-full border border-white">
                          {formatOfflineTimestamp(chatUser?.lastSeen)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {chatUser?.fullName}
                        </h3>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {formatTime(chat.lastMessage?.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate pr-6">
                        {chat.lastMessage?.text || 'Attachment'}
                      </p>
                    </div>
                    {currentUnread > 0 && (
                      <span className="badge-danger min-w-[20px] h-5 text-[10px]">
                        {currentUnread > 9 ? '9+' : currentUnread}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === chatId ? null : chatId);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>

                  <AnimatePresence>
                    {menuOpenId === chatId && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-4 top-3/4 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
                        >
                          <button
                            type="button"
                            onClick={(e) => handleArchive(e, chat, activeTab === 'archived')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {activeTab === 'archived' ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                            {activeTab === 'archived' ? t('unarchiveChat', language) : t('archiveChat', language)}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, chat)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            {t('delete', language) || 'Delete'}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setChatToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('deleteConversation', language) || 'Delete Conversation'}
        message={t('deleteConversationConfirm', language) || 'Are you sure you want to delete this conversation? This action cannot be undone.'}
        confirmText={t('delete', language) || 'Delete'}
        isDanger={true}
      />
    </div>
  );
};

export default ChatList;
