import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ContactListSkeleton } from './SkeletonLoader';
import { MessageSquare, Users, UserPlus, LogOut, Search, Star, Check, X, Plus, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import ControlCenter from './ControlCenter';

export default function ChatList({ className = '' }) {
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

  // Saved accounts swapper
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const { switchSavedAccount, getStories, createStory } = useApp();

  // Stories deck states
  const [storiesList, setStoriesList] = useState([]);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [newStoryText, setNewStoryText] = useState('');
  const [activeUserIndex, setActiveUserIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyTimer, setStoryTimer] = useState(0);

  const [activeTab, setActiveTab] = useState('chats'); // chats, contacts
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals visibility
  const [showControlCenter, setShowControlCenter] = useState(false);
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

  const loadStories = async () => {
    try {
      const dbStories = await getStories();
      const mockStories = [
        {
          _id: 'mock_1',
          username: 'alice_adventurer',
          profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          stories: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
              text: 'Road trip across Utah! 🏔️✨',
              createdAt: new Date(Date.now() - 3600000 * 2)
            },
            {
              imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
              text: 'Sandy beaches and crystal blue waves 🌊🌴',
              createdAt: new Date(Date.now() - 3600000 * 1)
            }
          ]
        },
        {
          _id: 'mock_2',
          username: 'designer_bob',
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          stories: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
              text: 'Scaffolding visual wireframes in Figma 💻📐',
              createdAt: new Date(Date.now() - 3600000 * 4)
            }
          ]
        },
        {
          _id: 'mock_3',
          username: 'chef_clara',
          profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
          stories: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
              text: 'Fresh handmade gourmet pizza! 🍕🔥',
              createdAt: new Date(Date.now() - 3600000 * 3)
            }
          ]
        }
      ];

      const combined = [...dbStories];
      mockStories.forEach(mock => {
        if (!combined.some(item => item.username === mock.username)) {
          combined.push(mock);
        }
      });
      setStoriesList(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    let interval;
    if (activeUserIndex !== null) {
      setStoryTimer(0);
      interval = setInterval(() => {
        setStoryTimer((prev) => {
          if (prev >= 100) {
            const userStories = storiesList[activeUserIndex]?.stories;
            if (userStories && activeStoryIndex < userStories.length - 1) {
              setActiveStoryIndex(prevIdx => prevIdx + 1);
            } else if (activeUserIndex < storiesList.length - 1) {
              setActiveUserIndex(prevIdx => prevIdx + 1);
              setActiveStoryIndex(0);
            } else {
              setActiveUserIndex(null);
            }
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeUserIndex, activeStoryIndex, storiesList]);

  const handleCreateStorySubmit = async (e) => {
    e.preventDefault();
    if (!newStoryUrl) return;
    const res = await createStory(newStoryUrl, newStoryText);
    if (res) {
      setNewStoryUrl('');
      setNewStoryText('');
      setShowCreateStoryModal(false);
      loadStories();
    }
  };

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
          <div className="user-profile-widget" onClick={() => setShowAccountDropdown(!showAccountDropdown)}>
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

      {/* Horizontal Active Now status row */}
      {activeTab === 'chats' && contacts.filter((c) => onlineUsers.includes(c._id)).length > 0 && (
        <div 
          className="active-now-bar" 
          style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid var(--glass-border)', 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none'
          }}
        >
          {contacts.filter((c) => onlineUsers.includes(c._id)).map((contact) => (
            <div
              key={contact._id}
              onClick={() => createChat(false, [contact._id])}
              style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', minWidth: '60px' }}
            >
              <div className="avatar-wrapper" style={{ width: '42px', height: '42px', position: 'relative' }}>
                {contact.profilePhoto ? (
                  <img className="avatar" src={contact.profilePhoto} alt={contact.username} style={{ borderRadius: '50%', border: '2px solid rgba(168,85,247,0.3)', width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '13px', borderRadius: '50%', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {contact.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="status-indicator online" style={{ bottom: '0px', right: '0px', width: '12px', height: '12px', border: '2px solid var(--bg-primary)' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60px', textAlign: 'center' }}>
                {contact.username}
              </span>
            </div>
          ))}
        </div>
      )}

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
          <>
            {/* STORIES HORIZONTAL SLIDER */}
            <div className="stories-horizontal-slider" style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--glass-border)',
              scrollbarWidth: 'none',
              whiteSpace: 'nowrap'
            }}>
              {/* Create story thumbnail */}
              <div
                onClick={() => setShowCreateStoryModal(true)}
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  minWidth: '55px'
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '1.5px dashed var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(168,85,247,0.05)',
                  position: 'relative'
                }}>
                  <Plus size={18} style={{ color: 'var(--accent-purple)' }} />
                </div>
                <span style={{ fontSize: '10.5px', marginTop: '6px', color: 'var(--text-secondary)' }}>Add Story</span>
              </div>

              {/* Feed stories */}
              {storiesList.map((feedItem, uIdx) => (
                <div
                  key={feedItem._id || uIdx}
                  onClick={() => {
                    setActiveUserIndex(uIdx);
                    setActiveStoryIndex(0);
                  }}
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    minWidth: '55px'
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    padding: '2.5px',
                    background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(168,85,247,0.3)'
                  }}>
                    {feedItem.profilePhoto ? (
                      <img src={feedItem.profilePhoto} alt={feedItem.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#000' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#3b0764', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                        {feedItem.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    marginTop: '6px',
                    color: 'var(--text-secondary)',
                    maxWidth: '55px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}>
                    {feedItem.username === user.username ? 'My Story' : feedItem.username}
                  </span>
                </div>
              ))}
            </div>

            {filteredConversations.length === 0 ? (
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
            )}
          </>
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
                          <div className="list-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {contact.username}
                            {user?.contactCategories?.[contact._id] && (
                              <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px' }}>
                                {user.contactCategories[contact._id]}
                              </span>
                            )}
                          </div>
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
      {showControlCenter && (
        <ControlCenter onClose={() => setShowControlCenter(false)} />
      )}

      {/* MULTIPLE ACCOUNT SWITCHER DROPDOWN */}
      {showAccountDropdown && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: '60px',
          left: '16px',
          zIndex: 250,
          width: '260px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Switch Accounts</span>
            <button className="icon-btn" onClick={() => setShowAccountDropdown(false)} style={{ padding: '2px' }}><X size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(() => {
              const savedAccs = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
              const currentExists = savedAccs.some(acc => acc.id === user.id);
              const list = [...savedAccs];
              if (!currentExists && user) {
                list.push({
                  id: user.id,
                  username: user.username,
                  profilePhoto: user.profilePhoto || '',
                  token: localStorage.getItem('token') || ''
                });
              }

              return list.map(acc => {
                const isActive = acc.id === user.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      if (isActive) return;
                      switchSavedAccount(acc.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: isActive ? 'default' : 'pointer',
                      background: isActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar-wrapper" style={{ width: '28px', height: '28px' }}>
                        {acc.profilePhoto ? (
                          <img className="avatar" src={acc.profilePhoto} alt={acc.username} />
                        ) : (
                          <div className="avatar-placeholder" style={{ fontSize: '10px' }}>{acc.username.substring(0, 2)}</div>
                        )}
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: isActive ? '600' : 'normal' }}>{acc.username}</span>
                    </div>
                    {isActive ? (
                      <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center' }}><Check size={14} /></span>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Swap</span>
                    )}
                  </div>
                );
              });
            })()}

            <button
              onClick={() => {
                logoutUser();
                setShowAccountDropdown(false);
              }}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--glass-border)',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '11px',
                color: 'var(--accent-purple)',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'center',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Plus size={12} /> Add Another Account
            </button>

            <button
              onClick={() => {
                setShowControlCenter(true);
                setShowAccountDropdown(false);
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline'
              }}
            >
              Settings & Security
            </button>
          </div>
        </div>
      )}

      {/* CREATE STORY CARD MODAL */}
      {showCreateStoryModal && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Publish Story</h2>
              <button className="icon-btn" onClick={() => setShowCreateStoryModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStorySubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Story Image URL</label>
                  <input
                    className="glass-input"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newStoryUrl}
                    onChange={(e) => setNewStoryUrl(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label>Story Caption Text</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Describe your moment... ✨✍️"
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setShowCreateStoryModal(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={!newStoryUrl}>Publish Story</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN STORY DECK VIEW SPECTATOR OVERLAY */}
      {storiesList[activeUserIndex] && storiesList[activeUserIndex].stories[activeStoryIndex] && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 8, 0.98)',
          backdropFilter: 'blur(35px)',
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Main Viewer Card */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            height: '90vh',
            maxHeight: '680px',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.9) 100%), url(${storiesList[activeUserIndex].stories[activeStoryIndex].imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            
            {/* Top progress indicators block */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px' }}>
              {storiesList[activeUserIndex].stories.map((s, idx) => {
                let fillVal = 0;
                if (idx < activeStoryIndex) fillVal = 100;
                if (idx === activeStoryIndex) fillVal = storyTimer;
                return (
                  <div key={idx} style={{ flex: 1, height: '3.5px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${fillVal}%`, height: '100%', background: 'white', transition: 'width 0.1s linear' }}></div>
                  </div>
                );
              })}
            </div>

            {/* Viewer Header Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden' }}>
                  {storiesList[activeUserIndex].profilePhoto ? (
                    <img src={storiesList[activeUserIndex].profilePhoto} alt={storiesList[activeUserIndex].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', background: '#3b0764' }}>
                      {storiesList[activeUserIndex].username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.6)', margin: 0 }}>
                    {storiesList[activeUserIndex].username}
                  </h3>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                    {new Date(storiesList[activeUserIndex].stories[activeStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Close spectator screen */}
              <button
                onClick={() => setActiveUserIndex(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Navigation click shields (Left and Right overlays) */}
            <div style={{ position: 'absolute', top: '100px', bottom: '120px', left: 0, right: 0, display: 'flex' }}>
              <div onClick={() => {
                if (activeStoryIndex > 0) {
                  setActiveStoryIndex(prev => prev - 1);
                } else if (activeUserIndex > 0) {
                  setActiveUserIndex(prev => prev - 1);
                  setActiveStoryIndex(storiesList[activeUserIndex - 1].stories.length - 1);
                }
              }} style={{ flex: 1, cursor: 'w-resize' }}></div>
              <div onClick={() => {
                const userStories = storiesList[activeUserIndex].stories;
                if (activeStoryIndex < userStories.length - 1) {
                  setActiveStoryIndex(prev => prev + 1);
                } else if (activeUserIndex < storiesList.length - 1) {
                  setActiveUserIndex(prev => prev + 1);
                  setActiveStoryIndex(0);
                } else {
                  setActiveUserIndex(null);
                }
              }} style={{ flex: 1, cursor: 'e-resize' }}></div>
            </div>

            {/* Bottom Caption slot */}
            <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center', paddingBottom: '16px' }}>
              <p style={{
                fontSize: '14.5px',
                fontWeight: '500',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                lineHeight: '1.4',
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                maxWidth: '90%'
              }}>
                {storiesList[activeUserIndex].stories[activeStoryIndex].text || 'No caption 📸'}
              </p>
            </div>
            
          </div>
        </div>
      )}

      {/* PROFILE CONFIG MODAL */}
      {showControlCenter && (
        <ControlCenter onClose={() => setShowControlCenter(false)} />
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
