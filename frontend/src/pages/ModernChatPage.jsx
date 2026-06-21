import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ModernSidebar from '../components/chat/ModernSidebar';
import ChatList from '../components/chat/ChatList';
import UserSearch from '../components/chat/UserSearch';
import GroupsList from '../components/chat/GroupsList';
import UserProfile from '../components/chat/UserProfile';
import ChatWindow from '../components/chat/ChatWindow';
import socketService from '../services/socket';
import { setOnlineUsers, setSelectedChat } from '../redux/slices/chatSlice';

const ModernChatPage = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const { selectedChat, token, chats } = useSelector((state) => state.chat);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chatId } = useParams();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Auto-select chat from URL parameter
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c._id === chatId);
      if (chat && selectedChat?._id !== chatId) {
        dispatch(setSelectedChat(chat));
        setMobileShowChat(true);
      }
    }
  }, [chatId, chats, dispatch, selectedChat]);

  // Hook up Socket events for online users tracking
  useEffect(() => {
    if (user?._id && token) {
      socketService.connect(token, user._id);
      
      socketService.on('online_users', (users) => {
        dispatch(setOnlineUsers(users));
      });

      return () => {
        socketService.off('online_users');
        socketService.disconnect();
      };
    }
  }, [user?._id, token, dispatch]);

  const handleChatStarted = () => {
    setActiveTab('chats');
    setMobileShowChat(true);
  };

  const handleSelectChat = (chat) => {
    dispatch(setSelectedChat(chat));
    navigate(`/messages/${chat._id}`);
    setMobileShowChat(true);
  };

  const renderActiveList = () => {
    switch (activeTab) {
      case 'search':
        return <UserSearch onChatCreated={handleSelectChat} />;
      case 'groups':
        return <GroupsList onChatCreated={handleSelectChat} />;
      case 'profile':
        return <UserProfile />;
      default:
        return <ChatList searchQuery={listSearchQuery} onSelectChat={handleSelectChat} />;
    }
  };

  return (
    <div className="chat-page-container chat-bg-pattern">
      {/* Background organic blur bubbles */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      <div className="chat-grid-layout">
        {/* Persistent Sidebar Navigation */}
        <div className="chat-sidebar-wrapper">
          <ModernSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Dynamic Lists Column */}
        <div className={`chat-list-column clay-card ${mobileShowChat && selectedChat ? 'hidden-mobile' : ''}`}>
          {/* Header Search for Chats List tab */}
          {activeTab === 'chats' && (
            <div className="chat-search-header-container">
              <input
                type="text"
                placeholder="Search chats..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="clay-input chat-search-input"
              />
            </div>
          )}
          <div className="chat-list-content-area">{renderActiveList()}</div>
        </div>

        {/* Primary Message Stream Panel */}
        <div className={`chat-window-column clay-card ${!mobileShowChat || !selectedChat ? 'hidden-mobile' : ''}`}>
          {selectedChat ? (
            <ChatWindow onBack={() => setMobileShowChat(false)} />
          ) : (
            <div className="empty-chat-state">
              <h2>Welcome to Chattix</h2>
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernChatPage;

