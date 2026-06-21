import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { setChats } from '../../redux/slices/chatSlice';
import SkeletalLoader from '../ui/SkeletalLoader';

const UserSearch = ({ onChatCreated }) => {
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
      if (onChatCreated) {
        onChatCreated(chat); // Pass chat to parent for navigation
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div className="search-container">
      <h3 className="search-title">Connect with users</h3>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search by name or @username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clay-input search-query-input"
        />
        <button type="submit" className="clay-btn clay-btn-primary search-btn">
          <Search size={18} />
        </button>
      </form>

      {loading ? (
        <SkeletalLoader type="list" count={4} />
      ) : results.length === 0 ? (
        <div className="search-empty">
          <p className="search-empty-text">Find friends on Chattix</p>
          <span className="search-empty-hint">Enter a search phrase to find someone in our directory.</span>
        </div>
      ) : (
        <div className="search-results-list">
          {results.map((user) => (
            <div key={user._id} className="search-result-card clay-card">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user.fullName)}`}
                alt="user"
                className="search-result-avatar"
              />
              <div className="search-result-info">
                <p className="search-result-name text-truncate">{user.fullName}</p>
                <p className="search-result-username text-truncate">@{user.username}</p>
              </div>
              <button
                onClick={() => startChat(user._id)}
                className="clay-btn clay-btn-primary search-connect-btn"
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

export default UserSearch;

