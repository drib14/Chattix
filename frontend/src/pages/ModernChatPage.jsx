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
  const { selectedChat, token, chats } = useSelector((state) => state.chat);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { chatId } = useParams();
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

  // Handle setting selected chat via URL parameter
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chatFromUrl = chats.find(c => c._id === chatId);
      if (chatFromUrl && selectedChat?._id !== chatId) {
        dispatch(setSelectedChat(chatFromUrl));
      }
    } else if (!chatId && selectedChat) {
       // if user is at /messages but a chat is selected, we could navigate to /messages/:chatId
       navigate(`/messages/${selectedChat._id}`, { replace: true });
    }
  }, [chatId, chats, selectedChat, dispatch, navigate]);

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
        return <ChatList />;
    }
  };

  return (
    <div className={`chat-page-container chat-bg-pattern ${chatId ? 'mobile-chat-view' : 'mobile-list-view'}`}>
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

