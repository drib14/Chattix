import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ContactListSkeleton } from './SkeletonLoader';
import { MessageSquare, Users, UserPlus, LogOut, Search, Star, Check, X, Plus, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function ChatList({ className = '', showAISidebar, setShowAISidebar }) {
  const {
    user,
    logoutUser,
    conversations,
    currentChat,
    setCurrentChat,
    contacts,
    pendingRequests,
    typingUsers,
    onlineUsers,
    favoriteContacts,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    toggleFavorite,
    updateProfile,
    createChat,
    loading
  } = useApp();

  const [activeTab, setActiveTab] = useState('chats'); // chats, contacts
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals visibility
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Profile editing
  const [statusText, setStatusText] = useState(user?.statusText || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');

  // Add friend search
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  
  // Group creation
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Automatically fetch other registered users when opening modal
  useEffect(() => {
    if (showAddContactModal) {
      const fetchAllUsers = async () => {
        const res = await searchUsers('');
        if (res.success) {
          setFoundUsers(res.users);
        }
      };
      fetchAllUsers();
    }
  }, [showAddContactModal]);

  // Search local chats
  const filteredConversations = conversations.filter((c) => {
    if (c.isGroup) {
      return c.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    const otherParticipant = c.participants.find((p) => p._id !== user.id);
    return otherParticipant?.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Search local contacts
  const filteredContacts = contacts.filter((c) =>
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Profile update submit
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateProfile(statusText, profilePhoto);
    setShowProfileModal(false);
  };

  // Friend search submit
  const handleFriendSearch = async (e) => {
    e.preventDefault();
    if (!friendSearchQuery) return;
    const res = await searchUsers(friendSearchQuery);
    if (res.success) {
      setFoundUsers(res.users);
    }
  };

  // Group creation submit
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName || selectedContacts.length === 0) return;
    const res = await createChat(true, selectedContacts, groupName);
    if (res.success) {
      // Wipe form and close
      setGroupName('');
      setSelectedContacts([]);
      setShowGroupModal(false);
    }
  };

  const toggleSelectContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Helper to format timestamps
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to resolve chat names & avatars
  const getChatDetails = (chat) => {
    if (chat.isGroup) {
      return {
        name: chat.name,
        photo: chat.avatar,
        fallback: chat.name.substring(0, 2),
        isOnline: false,
      };
    }
    const recipient = chat.participants.find((p) => p._id !== user.id);
    const isOnline = onlineUsers.includes(recipient?._id);
    return {
      name: recipient?.username || 'Chattix User',
      photo: recipient?.profilePhoto,
      fallback: (recipient?.username || 'CU').substring(0, 2),
      isOnline,
    };
  };

  return (
    <div className={`sidebar glass-panel ${className}`}>
      {/* Header Profile Widget */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo size={32} />
          <div className="user-profile-widget" onClick={() => setShowProfileModal(true)}>
            <div className="avatar-wrapper" style={{ width: '36px', height: '36px' }}>
              {user.profilePhoto ? (
                <img className="avatar" src={user.profilePhoto} alt={user.username} />
              ) : (
                <div className="avatar-placeholder" style={{ fontSize: '12px' }}>{user.username.substring(0, 2)}</div>
              )}
              <div className="status-indicator online"></div>
            </div>
            <div className="user-info-text">
              <h3 style={{ fontSize: '13px' }}>{user.username}</h3>
              <p style={{ fontSize: '11px', maxWidth: '100px' }}>{user.statusText || 'Available'}</p>
            </div>
          </div>
        </div>
        <div className="sidebar-actions">
          {/* Glowing Sparkles icon to instantly slide-in the AI Drawer even from sidebar list */}
          <button
            className="icon-btn"
            style={{ color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.45))' }}
            title="Chattix AI Assistant"
            onClick={() => setShowAISidebar(!showAISidebar)}
          >
            <Sparkles size={16} />
          </button>
          <button className="icon-btn" title="Add Contact" onClick={() => setShowAddContactModal(true)}>
            <UserPlus size={16} />
          </button>
          <button className="icon-btn" title="Create Group" onClick={() => setShowGroupModal(true)}>
            <Plus size={16} />
          </button>
          <button className="icon-btn" title="Log Out" onClick={logoutUser}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Local search bar */}
      <div className="sidebar-search">
        <div className="search-container">
          <Search size={14} className="search-icon" />
          <input
            className="glass-input"
            type="text"
            placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search contacts...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          <MessageSquare size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Conversations
        </button>
        <button
          className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Contacts {pendingRequests.length > 0 && <span className="list-item-badge" style={{ display: 'inline-flex', marginLeft: '4px', scale: '0.8' }}>{pendingRequests.length}</span>}
        </button>
      </div>

      {/* Main List */}
      <div className="sidebar-list">
        {/* CHATS TAB LIST */}
        {activeTab === 'chats' && (
          filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px', fontSize: '13px' }}>
              No conversations yet.<br />Add a contact to start chatting!
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const details = getChatDetails(chat);
              const isActive = currentChat && currentChat._id === chat._id;
              const isTyping = typingUsers[chat._id] && typingUsers[chat._id].length > 0;

              return (
                <div
                  key={chat._id}
                  className={`list-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentChat(chat)}
                >
                  <div className="avatar-wrapper" style={{ width: '38px', height: '38px' }}>
                    {details.photo ? (
                      <img className="avatar" src={details.photo} alt={details.name} />
                    ) : (
                      <div className="avatar-placeholder" style={{ fontSize: '13px' }}>{details.fallback}</div>
                    )}
                    <div className={`status-indicator ${details.isOnline ? 'online' : ''}`}></div>
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-header">
                      <div className="list-item-name">{details.name}</div>
                      {chat.lastMessage && (
                        <div className="list-item-time">{formatTime(chat.lastMessage.createdAt)}</div>
                      )}
                    </div>
                    <div className="list-item-footer">
                      {isTyping ? (
                        <span className="typing-text">typing...</span>
                      ) : chat.lastMessage ? (
                        <span className="list-item-preview">
                          {chat.lastMessage.sender.username === user.username ? 'You: ' : ''}
                          {chat.lastMessage.isDeleted ? 'This message was deleted.' : chat.lastMessage.content || 'Sent an attachment'}
                        </span>
                      ) : (
                        <span className="list-item-preview" style={{ fontStyle: 'italic' }}>No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* CONTACTS TAB LIST */}
        {activeTab === 'contacts' && (
          loading ? (
            <ContactListSkeleton />
          ) : (
            <>
              {/* PENDING REQUESTS DIRECTORY */}
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent-purple)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> Contact Requests
                  </div>
                  {pendingRequests.map((req) => (
                    <div key={req.sender._id} className="list-item" style={{ cursor: 'default' }}>
                      <div className="avatar-wrapper" style={{ width: '34px', height: '34px' }}>
                        {req.sender.profilePhoto ? (
                          <img className="avatar" src={req.sender.profilePhoto} alt={req.sender.username} />
                        ) : (
                          <div className="avatar-placeholder" style={{ fontSize: '11px' }}>{req.sender.username.substring(0, 2)}</div>
                        )}
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-name" style={{ fontSize: '13px' }}>{req.sender.username}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}
                            onClick={() => acceptRequest(req.sender._id)}
                          >
                            <Check size={11} /> Accept
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}
                            onClick={() => rejectRequest(req.sender._id)}
                          >
                            <X size={11} /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CONTACTS LIST */}
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', padding: '6px 10px' }}>
                My Contacts ({filteredContacts.length})
              </div>
              {filteredContacts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px', fontSize: '12px' }}>
                  No contacts listed.
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isOnline = onlineUsers.includes(contact._id);
                  const isFav = favoriteContacts.some((fav) => fav._id === contact._id);
                  return (
                    <div
                      key={contact._id}
                      className="list-item"
                      onClick={() => createChat(false, [contact._id])}
                    >
                      <div className="avatar-wrapper" style={{ width: '38px', height: '38px' }}>
                        {contact.profilePhoto ? (
                          <img className="avatar" src={contact.profilePhoto} alt={contact.username} />
                        ) : (
                          <div className="avatar-placeholder" style={{ fontSize: '13px' }}>{contact.username.substring(0, 2)}</div>
                        )}
                        <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-header">
                          <div className="list-item-name">{contact.username}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              className="icon-btn"
                              style={{ color: 'var(--accent-cyan)', opacity: 0.8, marginRight: '2px' }}
                              title="Start Conversation"
                              onClick={(e) => {
                                e.stopPropagation();
                                createChat(false, [contact._id]);
                              }}
                            >
                              <MessageSquare size={13} fill="none" />
                            </button>
                            <button
                              className="icon-btn"
                              style={{ color: isFav ? '#f59e0b' : 'var(--text-muted)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(contact._id);
                              }}
                            >
                              <Star size={12} fill={isFav ? '#f59e0b' : 'none'} />
                            </button>
                          </div>
                        </div>
                        <div className="list-item-preview" style={{ fontSize: '11px' }}>{contact.statusText || 'Active on Chattix'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )
        )}
      </div>

      {/* PROFILE CONFIG MODAL */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile Config</h2>
              <button className="icon-btn" onClick={() => setShowProfileModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Status message</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Hey there! I am using Chattix."
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Profile photo URL</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tip: You can use Cloudinary links or direct image URLs.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button className="btn-primary" type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTACT SEARCH MODAL */}
      {showAddContactModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Find Contacts</h2>
              <button className="icon-btn" onClick={() => {
                setShowAddContactModal(false);
                setFoundUsers([]);
                setFriendSearchQuery('');
              }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form className="search-container" onSubmit={handleFriendSearch} style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="glass-input"
                  style={{ flex: 1 }}
                  type="text"
                  placeholder="Search by username or email..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  required
                />
                <button className="btn-primary" type="submit" style={{ padding: '10px 14px' }}>Search</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                {foundUsers.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '20px 0' }}>
                    No users found matching query.
                  </p>
                ) : (
                  foundUsers.map((u) => {
                    const isFriend = contacts.some((c) => c._id === u._id);
                    return (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar-placeholder" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{u.username.substring(0,2)}</div>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{u.username}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.statusText}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Direct Message button to instantly open a conversation */}
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: 'none' }}
                            onClick={() => {
                              createChat(false, [u._id]);
                              setShowAddContactModal(false);
                              setFoundUsers([]);
                              setFriendSearchQuery('');
                            }}
                          >
                            Message
                          </button>
                          {isFriend ? (
                            <span style={{ fontSize: '11px', color: 'var(--status-online)', fontWeight: 'bold', display: 'flex', alignItems: 'center', padding: '0 4px' }}>Friend</span>
                          ) : (
                            <button
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                              onClick={() => {
                                sendRequest(u._id);
                                setShowAddContactModal(false);
                                setFoundUsers([]);
                                setFriendSearchQuery('');
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Create Group Chat</h2>
              <button className="icon-btn" onClick={() => setShowGroupModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Group Name</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="e.g. Project Launch 🚀"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Select Participants ({selectedContacts.length})</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '8px' }}>
                    {contacts.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No contacts available to add.</p>
                    ) : (
                      contacts.map((c) => {
                        const isChecked = selectedContacts.includes(c._id);
                        return (
                          <div
                            key={c._id}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', cursor: 'pointer', borderRadius: '6px', background: isChecked ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                            onClick={() => toggleSelectContact(c._id)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              style={{ accentColor: 'var(--accent-purple)' }}
                            />
                            <div className="avatar-placeholder" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{c.username.substring(0,2)}</div>
                            <span style={{ fontSize: '13px' }}>{c.username}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={selectedContacts.length === 0}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
