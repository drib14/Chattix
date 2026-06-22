import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setChats, setSelectedChat } from '../../redux/slices/chatSlice';
import api from '../../services/api';
import SkeletalLoader from '../ui/SkeletalLoader';

const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return '';
  const now = new Date();
  const diffMs = now - new Date(lastSeenDate);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return '1m';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}hr`;
  return `${diffDays}d`;
};

const ChatList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const { chats, selectedChat, onlineUsers } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const chatsData = await api.get('/chats');
        dispatch(setChats(chatsData));
      } catch (err) {
        console.error('Failed to load chats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [dispatch]);

  const getChatDetails = (chat) => {
    if (chat.isGroup) {
      return {
        name: chat.groupName,
        avatar: chat.groupAvatar || `https://ui-avatars.com/api/?background=4F46E5&color=fff&name=${encodeURIComponent(chat.groupName)}`,
        isOnline: false,
      };
    }

    const partner = chat.participants.find((p) => p._id !== user?._id);
    const partnerId = partner?._id;
    const isPartnerOnline = onlineUsers.includes(partnerId);

    return {
      name: partner?.fullName || 'Chattix User',
      avatar: partner?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(partner?.fullName || 'U')}`,
      isOnline: isPartnerOnline,
      lastSeen: partner?.lastSeen,
    };
  };

  const filteredChats = chats.filter((c) => {
    const details = getChatDetails(c);
    return details.name.toLowerCase().includes((localSearchQuery || '').toLowerCase());
  });

  if (loading) {
    return <SkeletalLoader type="list" count={6} />;
  }

  const pinnedChats = filteredChats.filter(chat => user?.pinnedChats?.includes(chat._id));
  const otherChats = filteredChats.filter(chat => !user?.pinnedChats?.includes(chat._id));

  return (
    <div className="chat-list-container">
      <div className="chat-search-header-container" style={{ padding: '24px 20px 16px 20px', borderBottom: '1.5px solid rgba(226, 232, 240, 0.6)' }}>
        <input
          type="text"
          placeholder="Search chats..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          className="clay-input chat-search-input"
          style={{ padding: '12px 18px', borderRadius: '16px', width: '100%' }}
        />
      </div>

      <h3 className="chat-list-title" style={{ padding: '16px 20px 8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 800, letterSpacing: '0.5px' }}>
        {pinnedChats.length > 0 ? 'Pinned Conversations' : 'Recent Conversations'}
      </h3>
      
      {filteredChats.length === 0 ? (
        <div className="chat-list-empty">
          <p className="chat-list-empty-text">No conversations found</p>
          <span className="chat-list-empty-hint">Use the Search tab to connect and start chatting!</span>
        </div>
      ) : (
        <div className="chat-list-wrapper">
          {pinnedChats.map((chat) => {
            const details = getChatDetails(chat);
            const isSelected = selectedChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                onClick={() => {
                  dispatch(setSelectedChat(chat));
                  navigate(`/messages/${chat._id}`);
                }}
                className={`chat-list-item ${isSelected ? 'chat-list-item-active' : ''}`}
              >
                <div className="chat-list-item-avatar-wrapper">
                  <img src={details.avatar} alt="avatar" className="chat-list-item-avatar" />
                  <div style={{ position: 'absolute', top: -5, right: -5, fontSize: '12px' }}>📌</div>
                  {details.isOnline ? (
                    <div className="chat-list-item-status clay-online" />
                  ) : (
                    details.lastSeen && (
                      <div className="chat-list-item-status-offline">
                        {formatLastSeen(details.lastSeen)}
                      </div>
                    )
                  )}
                </div>
                <div className="chat-list-item-content">
                  <div className="chat-list-item-header">
                    <h5 className="chat-list-item-name">{details.name}</h5>
                    <span className="chat-list-item-time">
                      {chat.lastMessage?.createdAt && new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="chat-list-item-preview">
                    {chat.lastMessage ? (
                      <p className={`preview-text ${!chat.lastMessage.seenBy?.some(s => s.user === user._id) ? 'unread' : ''}`}>
                        {chat.lastMessage.sender === user?._id ? 'You: ' : ''}
                        {chat.lastMessage.text || 'Sent an attachment'}
                      </p>
                    ) : (
                      <p className="preview-text">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {pinnedChats.length > 0 && <h3 className="chat-list-title" style={{ padding: '16px 20px 8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 800, letterSpacing: '0.5px' }}>Recent Conversations</h3>}

          {otherChats.map((chat) => {
            const details = getChatDetails(chat);
            const isSelected = selectedChat?._id === chat._id;
            
            return (
              <div
                key={chat._id}
                onClick={() => {
                  dispatch(setSelectedChat(chat));
                  navigate(`/messages/${chat._id}`);
                }}
                className={`chat-list-item ${isSelected ? 'chat-list-item-active' : ''}`}
              >
                {/* Avatar status bubble */}
                <div className="chat-list-item-avatar-wrapper">
                  <img src={details.avatar} alt="avatar" className="chat-list-item-avatar" />
                  {details.isOnline ? (
                    <div className="chat-list-item-status clay-online" />
                  ) : (
                    details.lastSeen && (
                      <div className="chat-list-item-offline-badge">
                        {formatLastSeen(details.lastSeen)}
                      </div>
                    )
                  )}
                </div>

                <div className="chat-list-item-info">
                  <div className="chat-list-item-header">
                    <span className="chat-list-item-name text-truncate">{details.name}</span>
                    {chat.lastMessage && (
                      <span className="chat-list-item-time">
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="chat-list-item-last-message text-truncate">
                    {chat.lastMessage
                      ? (chat.lastMessage.sender?._id === user?._id ? 'You: ' : '') + 
                        (chat.lastMessage.text || (chat.lastMessage.attachments?.length > 0 ? '📁 Attachment' : ''))
                      : 'Tap to start conversation'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;

