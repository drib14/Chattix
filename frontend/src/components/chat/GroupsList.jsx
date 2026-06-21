import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { setSelectedChat, setChats } from '../../redux/slices/chatSlice';
import SkeletalLoader from '../ui/SkeletalLoader';

const GroupsList = ({ onChatStarted }) => {
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
      dispatch(setSelectedChat(chat));
      // Clear forms
      setGroupName('');
      setSelectedMembers([]);
      if (onChatStarted) {
        onChatStarted();
      }
    } catch (err) {
      console.error('Group chat creation error:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Create Group Chat</h3>

      <form onSubmit={handleCreateGroup} style={styles.form} className="clay-card">
        <input
          type="text"
          placeholder="Group Name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="clay-input"
          style={styles.nameInput}
          required
        />
        
        <p style={styles.memberLabel}>Select Members ({selectedMembers.length} selected):</p>
        
        {loading ? (
          <SkeletalLoader type="list" count={3} />
        ) : friendsList.length === 0 ? (
          <p style={styles.noFriends}>No users available to add to group</p>
        ) : (
          <div style={styles.membersList}>
            {friendsList.map((user) => {
              const isChecked = selectedMembers.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => handleToggleMember(user._id)}
                  style={{
                    ...styles.memberRow,
                    ...(isChecked ? styles.memberRowSelected : {}),
                  }}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user.fullName)}`}
                    alt=""
                    style={styles.memberAvatar}
                  />
                  <div style={styles.memberInfo}>
                    <p style={styles.memberName} className="text-truncate">{user.fullName}</p>
                    <p style={styles.memberUser} className="text-truncate">@{user.username}</p>
                  </div>
                  <div style={{
                    ...styles.checkbox,
                    ...(isChecked ? styles.checkboxChecked : {}),
                  }}>
                    {isChecked && <span style={styles.checkmark}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          disabled={creating || !groupName.trim() || selectedMembers.length < 1}
          className="clay-btn clay-btn-primary"
          style={styles.createBtn}
        >
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </form>
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
  form: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    margin: '0 8px',
    flex: 1,
    maxHeight: 'calc(100% - 40px)',
  },
  nameInput: {
    marginBottom: '16px',
  },
  memberLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  noFriends: {
    fontSize: '12px',
    color: 'var(--text-light)',
    textAlign: 'center',
    padding: '16px 0',
  },
  membersList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    padding: '8px',
    background: '#f8fafc',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  memberRowSelected: {
    background: '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    objectFit: 'cover',
    background: '#e2e8f0',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  memberUser: {
    fontSize: '11px',
    color: 'var(--text-light)',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '6px',
    border: '1.5px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    transition: 'all 0.15s',
  },
  checkboxChecked: {
    background: 'var(--clay-success)',
    borderColor: 'var(--clay-success)',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 800,
  },
  createBtn: {
    width: '100%',
    borderRadius: '14px',
    padding: '12px 0',
  },
};

export default GroupsList;
