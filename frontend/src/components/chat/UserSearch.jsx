import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { setSelectedChat, setChats } from '../../redux/slices/chatSlice';
import SkeletalLoader from '../ui/SkeletalLoader';

const UserSearch = ({ onChatStarted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await api.get(`/chats/users?search=${encodeURIComponent(searchQuery)}`);
      setResults(data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (userId) => {
    try {
      const chat = await api.post('/chats', { userId });
      // Reload chats list
      const chatsData = await api.get('/chats');
      dispatch(setChats(chatsData));
      dispatch(setSelectedChat(chat));
      if (onChatStarted) {
        onChatStarted(); // Trigger navigation shift
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Connect with users</h3>
      
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          placeholder="Search by name or @username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clay-input"
          style={styles.searchInput}
        />
        <button type="submit" className="clay-btn clay-btn-primary" style={styles.searchBtn}>
          <Search size={18} />
        </button>
      </form>

      {loading ? (
        <SkeletalLoader type="list" count={4} />
      ) : results.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Find friends on Chattix</p>
          <span style={styles.emptyHint}>Enter a search phrase to find someone in our directory.</span>
        </div>
      ) : (
        <div style={styles.list}>
          {results.map((user) => (
            <div key={user._id} style={styles.userRow} className="clay-card">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user.fullName)}`}
                alt="user"
                style={styles.avatar}
              />
              <div style={styles.info}>
                <p style={styles.name} className="text-truncate">{user.fullName}</p>
                <p style={styles.username} className="text-truncate">@{user.username}</p>
              </div>
              <button
                onClick={() => startChat(user._id)}
                className="clay-btn clay-btn-primary"
                style={styles.connectBtn}
              >
                Chat
              </button>
            </div>
          ))}
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
  searchForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    padding: '0 8px',
  },
  searchInput: {
    flex: 1,
  },
  searchBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    padding: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flex: 1,
    padding: '0 8px 8px 8px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#ffffff',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    objectFit: 'cover',
    background: '#e2e8f0',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  username: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  connectBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '12.5px',
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

export default UserSearch;
