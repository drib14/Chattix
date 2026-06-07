import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ModernSidebar from '../components/ModernSidebar';
import MobileNav from '../components/MobileNav';
import MobileHeader from '../components/MobileHeader';
import ChatList from '../components/ChatList';
import FriendsList from '../components/FriendsList';
import FriendRequests from '../components/FriendRequests';
import UserSearch from '../components/UserSearch';
import SettingsPanel from '../components/SettingsPanel';
import NotificationPanel from '../components/NotificationPanel';
import GroupsList from '../components/GroupsList';
import ChatWindow from '../components/ChatWindow';
import UserProfile from '../components/UserProfile';
import GroupDetails from '../components/GroupDetails';
import GroupSettings from '../components/GroupSettings';
import MemberManagement from '../components/MemberManagement';
import GlobalSearchBar from '../components/GlobalSearchBar';
import socketService from '../services/socket';
import { friendService } from '../services/friendService';
import { messageService } from '../services/messageService';
import { groupService } from '../services/groupService';
import { notificationService } from '../services/notificationService';
import {
  setFriends,
  setPendingRequests,
  setSentRequests,
  addPendingRequest,
  addFriend,
  removePendingRequest,
} from '../redux/slices/friendSlice';
import {
  setRecentChats,
  addMessage,
  setOnlineUsers,
  incrementUnread,
  updateRecentChat,
  setGroups,
} from '../redux/slices/chatSlice';
import {
  setNotifications,
  setUnreadCount,
} from '../redux/slices/notificationSlice';
import toast from 'react-hot-toast';

const getBreakpoint = () => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const ModernChatPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { selectedChat, recentChats } = useSelector((state) => state.chat);
  const { pendingRequests } = useSelector((state) => state.friend);
  const { unreadCount: notifUnread } = useSelector((state) => state.notification);

  const [activeTab, setActiveTab] = useState('chats');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [groupDetailsPanel, setGroupDetailsPanel] = useState('info');
  const [mobileView, setMobileView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [breakpoint, setBreakpoint] = useState(getBreakpoint);
  const [searchQuery, setSearchQuery] = useState('');

  const dispatch = useDispatch();
  const selectedChatRef = useRef(selectedChat);
  const userRef = useRef(user);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isCompact = isMobile || isTablet;

  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) setShowSidebar(false);
  }, [isDesktop]);

  useEffect(() => {
    loadInitialData();
    setupSocketListeners();
    return () => {
      ['friend_request_received', 'friend_request', 'friend_request_accepted',
        'receive_message', 'online_users', 'notification'].forEach((e) => socketService.off(e));
    };
  }, []);

  useEffect(() => {
    if (selectedChat && isMobile) setMobileView('chat');
  }, [selectedChat, isMobile]);

  useEffect(() => {
    if (isCompact) {
      document.body.style.overflow = showSidebar ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }
  }, [showSidebar, isCompact]);

  const loadInitialData = async () => {
    try {
      const [friendsData, pendingData, sentData, chatsData, groupsData, notifs, notifCount] =
        await Promise.all([
          friendService.getFriends(),
          friendService.getPendingRequests(),
          friendService.getSentRequests(),
          messageService.getRecentChats(),
          groupService.getUserGroups(),
          notificationService.getAll(),
          notificationService.getUnreadCount(),
        ]);

      dispatch(setFriends(friendsData));
      dispatch(setPendingRequests(pendingData));
      dispatch(setSentRequests(sentData));
      dispatch(setRecentChats(chatsData));
      const groups = Array.isArray(groupsData) ? groupsData : [];
      dispatch(setGroups(groups));
      groups.forEach((group) => {
        if (group?._id) {
          socketService.joinRoom(group._id);
        }
      });
      dispatch(setNotifications(notifs));
      dispatch(setUnreadCount(notifCount));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const isMessageForCurrentChat = (message) => {
    const current = selectedChatRef.current;
    if (!current?._id) return false;
    const myId = userRef.current?._id?.toString();
    const chatId = current._id.toString();
    const senderId = message.sender?._id?.toString() || message.sender?.toString();
    const receiverId = message.receiver?._id?.toString() || message.receiver?.toString();
    const groupId = message.group?.toString();
    if (current.isGroup) return groupId === chatId;
    return senderId === chatId || receiverId === chatId ||
      (senderId === myId && receiverId === chatId) ||
      (receiverId === myId && senderId === chatId);
  };

  const setupSocketListeners = () => {
    const onFriendRequest = ({ from }) => {
      if (from) {
        dispatch(addPendingRequest(from));
        toast.success(`${from.fullName} sent a friend request`);
      }
    };
    socketService.on('friend_request_received', onFriendRequest);
    socketService.on('friend_request', onFriendRequest);

    socketService.on('friend_request_accepted', ({ from }) => {
      if (from) {
        dispatch(addFriend(from));
        dispatch(removePendingRequest(from._id));
        toast.success(`${from.fullName} accepted your request`);
      }
    });

    socketService.on('receive_message', (message) => {
      if (!message?._id) return;
      if (isMessageForCurrentChat(message)) dispatch(addMessage(message));
      dispatch(updateRecentChat({ userId: message.sender?._id || message.group, message }));

      const senderId = message.sender?._id?.toString() || message.sender?.toString();
      const currentChatId = selectedChatRef.current?._id?.toString();
      const myId = userRef.current?._id?.toString();

      if (senderId && senderId !== myId && senderId !== currentChatId) {
        dispatch(incrementUnread(senderId));
        toast(`New message from ${message.sender?.fullName || 'someone'}`, { icon: '💬' });
      }
    });

    socketService.on('online_users', (users) => {
      dispatch(setOnlineUsers(Array.isArray(users) ? users : []));
    });

    socketService.on('notification', () => {
      notificationService.getUnreadCount().then((c) => dispatch(setUnreadCount(c)));
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowSidebar(false);
    if (isMobile) setMobileView('list');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'friends': return <FriendsList />;
      case 'requests': return <FriendRequests />;
      case 'search': return <UserSearch />;
      case 'groups': return <GroupsList />;
      case 'notifications': return <NotificationPanel />;
      case 'settings': return <SettingsPanel />;
      default: return <ChatList />;
    }
  };

  const unreadChats = (Array.isArray(recentChats) ? recentChats : [])
    .reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navBadges = {
    chats: unreadChats,
    requests: pendingRequests?.length || 0,
    notifications: notifUnread,
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-chattix-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-chattix-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showListPanel = isDesktop || isTablet || (isMobile && mobileView === 'list');
  const showChatPanel = isDesktop || isTablet || (isMobile && mobileView === 'chat');

  return (
    <div className="h-[100dvh] flex flex-col bg-chattix-bg overflow-hidden max-w-[100vw] w-full lg:flex-row pb-nav lg:pb-0">
      {/* Mobile Header - only on mobile */}
      {isMobile && (
        <MobileHeader 
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onMenuOpen={() => {}}
        />
      )}

      {/* Sidebar drawer — mobile & tablet */}
      <AnimatePresence>
        {showSidebar && isCompact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[min(280px,85vw)] max-w-full lg:hidden safe-bottom"
            >
              <ModernSidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onClose={() => setShowSidebar(false)}
                badges={navBadges}
                expanded
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent sidebar — desktop only */}
      {isDesktop && (
        <div className="shrink-0 h-full hidden lg:block">
          <ModernSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            badges={navBadges}
            expanded
          />
        </div>
      )}

      {/* List / panel column */}
      {showListPanel && (
        <div
          className={`flex flex-col bg-white border-r border-gray-200 min-h-0 min-w-0 overflow-hidden
            ${isMobile ? 'w-full flex-1' : ''}
            ${isTablet ? 'w-72 md:w-80 shrink-0' : ''}
            ${isDesktop ? 'w-80 xl:w-96 shrink-0' : ''}
          `}
        >
          {/* Tablet top bar with search */}
          {isTablet && (
            <div className="shrink-0 border-b border-gray-100 bg-white">
              <GlobalSearchBar 
                onSearch={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
        </div>
      )}

      {/* Chat column */}
      {showChatPanel && (
        <div
          className={`flex flex-col min-h-0 min-w-0 overflow-hidden
            ${isMobile ? 'w-full flex-1' : 'flex-1'}
          `}
        >
          <ChatWindow
            onToggleProfile={() => setShowProfile(true)}
            onGroupInfoClick={() => setShowGroupDetails(true)}
            showBack={isMobile}
            onBack={() => setMobileView('list')}
          />
        </div>
      )}

      {/* Mobile profile sheet */}
      <AnimatePresence>
        {showProfile && selectedChat && isCompact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowProfile(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed inset-x-0 bottom-0 top-12 z-50 bg-white rounded-t-2xl overflow-hidden safe-bottom lg:hidden"
            >
              <UserProfile user={selectedChat} onClose={() => setShowProfile(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop profile panel */}
      <AnimatePresence>
        {showProfile && selectedChat && isDesktop && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="w-72 xl:w-80 border-l border-gray-200 bg-white shrink-0 hidden lg:block overflow-hidden"
          >
            <UserProfile user={selectedChat} onClose={() => setShowProfile(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Details - Mobile Sheet */}
      <AnimatePresence>
        {showGroupDetails && selectedChat?.isGroup && isCompact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowGroupDetails(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed inset-x-0 bottom-0 top-12 z-50 bg-white rounded-t-2xl overflow-hidden safe-bottom lg:hidden"
            >
              {showGroupSettings ? (
                <GroupSettings
                  group={selectedChat}
                  onClose={() => {
                    setShowGroupSettings(false);
                    setShowGroupDetails(false);
                  }}
                  onUpdate={(updated) => {
                    dispatch(setRecentChats(
                      recentChats.map(c => c._id === updated._id ? updated : c)
                    ));
                  }}
                />
              ) : (
                <GroupDetails
                  group={selectedChat}
                  onClose={() => setShowGroupDetails(false)}
                  onSettingsClick={() => setShowGroupSettings(true)}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Group Details - Desktop Panel */}
      <AnimatePresence>
        {showGroupDetails && selectedChat?.isGroup && isDesktop && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="w-96 border-l border-gray-200 bg-white shrink-0 hidden lg:flex flex-col overflow-hidden"
          >
            {showGroupSettings ? (
              <GroupSettings
                group={selectedChat}
                onClose={() => setShowGroupSettings(false)}
                onUpdate={(updated) => {
                  dispatch(setRecentChats(
                    recentChats.map(c => c._id === updated._id ? updated : c)
                  ));
                }}
              />
            ) : (
              <GroupDetails
                group={selectedChat}
                onClose={() => setShowGroupDetails(false)}
                onSettingsClick={() => setShowGroupSettings(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} badges={navBadges} />
    </div>
  );
};

export default ModernChatPage;
