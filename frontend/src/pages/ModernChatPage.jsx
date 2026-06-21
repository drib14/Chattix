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
    <div style={styles.page} className="chat-bg-pattern">
      <div style={styles.gridContainer}>
        {/* Persistent Sidebar Navigation */}
        <div style={styles.sidebarSection}>
          <ModernSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Dynamic Lists Column */}
        <div style={styles.listSection} className="clay-card">
          {/* Header Search for Chats List tab */}
          {activeTab === 'chats' && (
            <div style={styles.searchHeader}>
              <input
                type="text"
                placeholder="Search chats..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="clay-input"
                style={styles.listSearchInput}
              />
            </div>
          )}
          <div style={styles.listContent}>{renderActiveList()}</div>
        </div>

        {/* Primary Message Stream Panel */}
        <div style={styles.chatSection} className="clay-card">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  gridContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    maxWidth: '1440px',
    gap: '20px',
    position: 'relative',
  },
  sidebarSection: {
    display: 'flex',
    height: '100%',
    flexShrink: 0,
  },
  listSection: {
    width: '320px',
    height: '100%',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  searchHeader: {
    padding: '20px 16px 12px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  listSearchInput: {
    padding: '10px 16px',
    borderRadius: '12px',
  },
  listContent: {
    flex: 1,
    overflow: 'hidden',
  },
  chatSection: {
    flex: 1,
    height: '100%',
    background: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
  },
};

export default ModernChatPage;
