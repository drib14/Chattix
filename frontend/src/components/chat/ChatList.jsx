import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setChats, setSelectedChat } from '../../redux/slices/chatSlice';
import api from '../../services/api';
import SkeletalLoader from '../ui/SkeletalLoader';

const ChatList = ({ searchQuery }) => {
  const dispatch = useDispatch();
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
    };
  };

  const filteredChats = chats.filter((c) => {
    const details = getChatDetails(c);
    return details.name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  if (loading) {
    return <SkeletalLoader type="list" count={6} />;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Recent Conversations</h3>
      
      {filteredChats.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No conversations found</p>
          <span style={styles.emptyHint}>Use the Search tab to connect and start chatting!</span>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredChats.map((chat) => {
            const details = getChatDetails(chat);
            const isSelected = selectedChat?._id === chat._id;
            
            return (
              <div
                key={chat._id}
                onClick={() => dispatch(setSelectedChat(chat))}
                style={{
                  ...styles.chatItem,
                  ...(isSelected ? styles.chatItemActive : {}),
                }}
              >
                {/* Avatar status bubble */}
                <div style={styles.avatarWrapper}>
                  <img src={details.avatar} alt="avatar" style={styles.avatar} />
                  {details.isOnline && <div style={styles.statusBadge} className="clay-online" />}
                </div>

                <div style={styles.info}>
                  <div style={styles.row}>
                    <span style={styles.name} className="text-truncate">{details.name}</span>
                    {chat.lastMessage && (
                      <span style={styles.time}>
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p style={styles.lastMsg} className="text-truncate">
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '8px 4px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--text-light)',
    marginBottom: '16px',
    paddingLeft: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    flex: 1,
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    border: '1px solid transparent',
  },
  chatItemActive: {
    background: '#ffffff',
    borderColor: 'rgba(99, 102, 241, 0.12)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.02), inset 0 -3px 4px rgba(0, 0, 0, 0.01), inset 0 3px 4px rgba(255, 255, 255, 0.9)',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '16px',
    objectFit: 'cover',
    background: '#e2e8f0',
  },
  statusBadge: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    zIndex: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '3px',
  },
  name: {
    fontSize: '14.5px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  time: {
    fontSize: '11px',
    color: 'var(--text-light)',
    fontWeight: 500,
  },
  lastMsg: {
    fontSize: '12.5px',
    color: 'var(--text-secondary)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '32px 16px',
    flex: 1,
  },
  emptyText: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '12px',
    color: 'var(--text-light)',
  },
};

export default ChatList;
