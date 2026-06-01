import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Users, UserCheck, UserPlus, Ban, Star, MessageSquare } from 'lucide-react';

export default function ContactsSidebarList({ onSelectContact }) {
  const {
    user,
    contacts,
    pendingRequests,
    onlineUsers,
    favoriteContacts,
    createChat,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [contactsTab, setContactsTab] = useState('all'); // all, online, requests

  // Filter contacts based on search and sub-tab selection
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.username.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (contactsTab === 'online') {
      return onlineUsers.includes(c._id);
    }
    return true;
  });

  // Handle clicking a contact to open a direct message chat
  const handleOpenChat = async (contactId) => {
    try {
      showToast('Opening conversation...', 'info');
      const res = await createChat(false, [contactId]);
      if (res && res.success) {
        // Dispatch pivot event to update App.jsx active tab to 'chats'
        window.dispatchEvent(new CustomEvent('pivot_to_chats', { detail: { chatId: res.conversation._id } }));
      } else {
        showToast('Could not open conversation.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error opening chat.', 'error');
    }
  };

  return (
    <div className="sidebar glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.2s ease-out' }}>
      
      {/* Sidebar Header */}
      <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={20} className="text-cyan-glowing" style={{ color: 'var(--accent-cyan)' }} />
          People
        </h2>
        <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
          {contacts.length} Friends
        </span>
      </div>

      {/* Search Container */}
      <div className="sidebar-search" style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="search-container">
          <Search size={15} className="search-icon" />
          <input
            className="glass-input"
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px', height: '36px' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs" style={{ padding: '8px 12px', gap: '4px', borderBottom: '1px solid var(--glass-border)' }}>
        <button
          className={`tab-btn ${contactsTab === 'all' ? 'active' : ''}`}
          onClick={() => setContactsTab('all')}
          style={{ fontSize: '11px', padding: '6px 4px' }}
        >
          All
        </button>
        <button
          className={`tab-btn ${contactsTab === 'online' ? 'active' : ''}`}
          onClick={() => setContactsTab('online')}
          style={{ fontSize: '11px', padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          Active ({contacts.filter(c => onlineUsers.includes(c._id)).length})
        </button>
        <button
          className={`tab-btn ${contactsTab === 'requests' ? 'active' : ''}`}
          onClick={() => setContactsTab('requests')}
          style={{ fontSize: '11px', padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '99px' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Contacts List Scroll Container */}
      <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {contactsTab === 'requests' ? (
          pendingRequests.length === 0 ? (
            <div style={{ padding: '40px 10px', textAlignment: 'center', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
              No pending requests.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  marginBottom: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                    {req.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>@{req.username}</span>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (onSelectContact) onSelectContact(req._id);
                    // Pivot context handles accept
                  }}
                  style={{ padding: '4px 8px', fontSize: '10px', boxShadow: 'none' }}
                >
                  Manage
                </button>
              </div>
            ))
          )
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No friends found.
          </div>
        ) : (
          filteredContacts.map((c) => {
            const isOnline = onlineUsers.includes(c._id);
            const isFav = favoriteContacts.some((f) => f._id === c._id);
            const catMap = user?.contactCategories || {};
            const activeCat = catMap[c._id] || '';

            return (
              <div
                key={c._id}
                onClick={() => {
                  if (onSelectContact) onSelectContact(c._id);
                }}
                className="list-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div className="avatar-wrapper" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                    {c.profilePhoto ? (
                      <img className="avatar" src={c.profilePhoto} alt={c.username} />
                    ) : (
                      <div className="avatar-placeholder" style={{ fontSize: '11px' }}>
                        {c.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{c.username}</span>
                      {isFav && <Star size={10} fill="#eab308" stroke="#eab308" style={{ flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {isOnline ? 'Active now' : c.statusText || 'Offline'}
                    </div>
                  </div>
                </div>

                {/* Quick message trigger */}
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenChat(c._id);
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.08)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={`Message @${c.username}`}
                >
                  <MessageSquare size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
