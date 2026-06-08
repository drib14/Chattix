import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MoreVertical, Archive, ArchiveRestore } from 'lucide-react';
import { setSelectedChat, clearUnread } from '../redux/slices/chatSlice';
import { userService } from '../services/userService';
import { t } from '../utils/translations';
import toast from 'react-hot-toast';
import StoryTray from './StoryTray';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const ChatList = () => {
  const { recentChats, onlineUsers, selectedChat, unreadCounts } = useSelector((state) => state.chat);
  const { language } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const [archivedChats, setArchivedChats] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    userService.getArchivedChats().then(setArchivedChats).catch(() => {});
  }, []);

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
    } catch {
      toast.error('Action failed');
    }
    setMenuOpenId(null);
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

  const archivedIds = new Set(archivedChats.map(ac => ac.chatId?._id?.toString()));
  const filteredChats = (Array.isArray(recentChats) ? recentChats : []).filter(
    c => !archivedIds.has(c._id?._id?.toString())
  );

  const displayChats = showArchived
    ? (Array.isArray(recentChats) ? recentChats : []).filter(c => archivedIds.has(c._id?._id?.toString()))
    : filteredChats;

  const handleSelectChat = (chat) => {
    if (chat._id) {
      dispatch(setSelectedChat(chat._id));
      dispatch(clearUnread(chat._id._id || chat._id));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <StoryTray />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {archivedChats.length > 0 && (
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
              <Archive size={16} />
              {t('archivedChats', language)}
            </div>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {archivedChats.length}
            </span>
          </button>
        )}
        {displayChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-chattix-bg rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Start chatting with your friends</p>
          </div>
        ) : (
          <div>
            {displayChats.map((chat, index) => {
              const chatUser = chat._id;
              const chatId = chatUser?._id?.toString();
              const isOnline = onlineUsers.some((u) => {
                const uid = typeof u === 'object' && u !== null ? u.userId : u;
                return uid?.toString() === chatId;
              });
              const isSelected =
                selectedChat?._id?.toString() === chatId;

              const currentUnread = unreadCounts[chatId] !== undefined ? unreadCounts[chatId] : (chat.unreadCount || 0);

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
                      <img
                        src={
                          chatUser?.avatar ||
                          `${DEFAULT_AVATAR}&name=${encodeURIComponent(chatUser?.fullName || 'U')}`
                        }
                        alt={chatUser?.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isOnline ? (
                        <div className="absolute bottom-0 right-0 online-indicator" />
                      ) : (
                        <div className="absolute bottom-0 right-0 offline-indicator" />
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
                            onClick={(e) => handleArchive(e, chat, showArchived)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                            {showArchived ? t('unarchiveChat', language) : t('archiveChat', language)}
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
    </div>
  );
};

export default ChatList;
