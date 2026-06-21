import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ModernSidebar from '../components/chat/ModernSidebar';
import ChatList from '../components/chat/ChatList';
import UserSearch from '../components/chat/UserSearch';
import GroupsList from '../components/chat/GroupsList';
import UserProfile from '../components/chat/UserProfile';
import ChatWindow from '../components/chat/ChatWindow';
import socketService from '../services/socket';
import { setOnlineUsers } from '../redux/slices/chatSlice';

const ModernChatPage = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const { selectedChat, token } = useSelector((state) => state.chat);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
  };

  const renderActiveList = () => {
    switch (activeTab) {
      case 'search':
        return <UserSearch onChatStarted={handleChatStarted} />;
      case 'groups':
        return <GroupsList onChatStarted={handleChatStarted} />;
      case 'profile':
        return <UserProfile />;
      default:
        return <ChatList searchQuery={listSearchQuery} />;
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
        <div className="chat-list-column clay-card">
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
        <div className="chat-window-column clay-card">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default ModernChatPage;

