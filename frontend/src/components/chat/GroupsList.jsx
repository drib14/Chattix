import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { setSelectedChat, setChats } from '../../redux/slices/chatSlice';
import SkeletalLoader from '../ui/SkeletalLoader';

const GroupsList = ({ onChatCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // Find users to include in group chat
        const data = await api.get('/chats/users');
        setFriendsList(data);
      } catch (err) {
        console.error('Failed to fetch group member options:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const handleToggleMember = (userId) => {
    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length < 1) return;

    setCreating(true);
    try {
      const chat = await api.post('/chats/group', {
        name: groupName,
        users: selectedMembers,
      });
      // Refresh chats list
      const chatsData = await api.get('/chats');
      dispatch(setChats(chatsData));
      // Clear forms
      setGroupName('');
      setSelectedMembers([]);
      if (onChatCreated) {
        onChatCreated(chat); // Pass chat to parent for navigation
      }
    } catch (err) {
      console.error('Group chat creation error:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="groups-container">
      <h3 className="groups-title">Create Group Chat</h3>

      <form onSubmit={handleCreateGroup} className="clay-card groups-form">
        <input
          type="text"
          placeholder="Group Name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="clay-input groups-name-input"
          required
        />
        
        <p className="groups-label">Select Members ({selectedMembers.length} selected):</p>
        
        {loading ? (
          <SkeletalLoader type="list" count={3} />
        ) : friendsList.length === 0 ? (
          <p className="groups-no-friends">No users available to add to group</p>
        ) : (
          <div className="groups-members-list">
            {friendsList.map((user) => {
              const isChecked = selectedMembers.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => handleToggleMember(user._id)}
                  className={`groups-member-row ${isChecked ? 'groups-member-row-selected' : ''}`}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user.fullName)}`}
                    alt=""
                    className="groups-member-avatar"
                  />
                  <div className="groups-member-info">
                    <p className="groups-member-name text-truncate">{user.fullName}</p>
                    <p className="groups-member-user text-truncate">@{user.username}</p>
                  </div>
                  <div className={`groups-checkbox ${isChecked ? 'groups-checkbox-checked' : ''}`}>
                    {isChecked && <span className="groups-checkmark">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          disabled={creating || !groupName.trim() || selectedMembers.length < 1}
          className="clay-btn clay-btn-primary groups-submit-btn"
        >
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

export default GroupsList;

