import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserPlus, QrCode, Trash2, Ban, Star, Check, X, ShieldAlert, ChevronLeft, MessageSquare } from 'lucide-react';

export default function ContactsPage({ selectedContactId, onClearSelection }) {
  const {
    user,
    contacts,
    pendingRequests,
    sentRequests,
    blockedUsers,
    favoriteContacts,
    onlineUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    toggleFavorite,
    removeContact,
    blockUser,
    unblockUser,
    categorizeContact,
    createChat,
    searchUsers,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [qrFriendInput, setQrFriendInput] = useState('');

  // Selected categories for tabs
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All'); // All, Friends, Work, Family

  // Handle Search Users
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const res = await searchUsers(searchQuery);
    setSearching(false);
    if (res.success) {
      setSearchResults(res.users);
      if (res.users.length === 0) {
        showToast('No users matching that criteria found.', 'info');
      }
    } else {
      showToast('Search failed.', 'error');
    }
  };

  // QR friendship adding
  const handleQrFriend = async (e) => {
    e.preventDefault();
    if (!qrFriendInput.trim()) return;
    const res = await searchUsers(qrFriendInput);
    if (res.success && res.users.length > 0) {
      const found = res.users[0];
      await createChat(false, [found._id]);
      showToast(`Instantly added contact via QR Code signature!`, 'success');
      setQrFriendInput('');
    } else {
      showToast('No user found matching that QR Code token.', 'error');
    }
  };

  // Assign Categories
  const handleCategorize = async (friendId, cat) => {
    await categorizeContact(friendId, cat);
    showToast('Contact categorization updated!', 'success');
  };

  // Filtered contacts by category
  const filteredContacts = contacts.filter((c) => {
    if (selectedCategoryTab === 'All') return true;
    const catMap = user?.contactCategories || {};
    const contactCat = catMap[c._id] || '';
    return contactCat.toLowerCase() === selectedCategoryTab.toLowerCase();
  });

  // Handle Message direct trigger
  const handleMessageContact = async (contactId) => {
    try {
      showToast('Opening conversation room...', 'info');
      const res = await createChat(false, [contactId]);
      if (res && res.success) {
        window.dispatchEvent(new CustomEvent('pivot_to_chats', { detail: { chatId: res.conversation._id } }));
      }
    } catch(e) {
      console.error(e);
      showToast('Error opening chat.', 'error');
    }
  };

  // 1. DETAIL CARD VIEW (WHEN FRIEND SELECTED)
  if (selectedContactId) {
    const selectedContact = contacts.find(c => c._id === selectedContactId) || 
                            pendingRequests.find(c => c._id === selectedContactId) ||
                            blockedUsers.find(c => c._id === selectedContactId);

    if (!selectedContact) {
      return (
        <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '25px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Friend details not found.</span>
          <button className="btn-secondary" style={{ marginTop: '10px' }} onClick={onClearSelection}>Back to Dashboard</button>
        </div>
      );
    }

    const isOnline = onlineUsers.includes(selectedContact._id);
    const catMap = user?.contactCategories || {};
    const activeCat = catMap[selectedContact._id] || '';
    const isFav = favoriteContacts.some(f => f._id === selectedContact._id);
    const isBlocked = blockedUsers.some(b => b._id === selectedContact._id);
    const isPending = pendingRequests.some(r => r._id === selectedContact._id);

    return (
      <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '30px', animation: 'scaleUp 0.25s ease-out' }}>
        
        {/* Back navigation */}
        <button
          onClick={onClearSelection}
          className="btn-secondary"
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '20px',
            boxShadow: 'none'
          }}
        >
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        {/* Profile Details Card Container */}
        <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '40px 20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '520px', margin: '0 auto', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          
          {/* Large Avatar Wrapper */}
          <div style={{ position: 'relative', width: '96px', height: '96px' }}>
            {selectedContact.profilePhoto ? (
              <img src={selectedContact.profilePhoto} alt={selectedContact.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3.5px solid var(--accent-cyan)' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', border: '3px solid var(--accent-cyan)' }}>
                {selectedContact.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className={`status-indicator ${isOnline ? 'online' : ''}`} style={{ width: '20px', height: '20px', border: '3.5px solid var(--bg-secondary)', bottom: '4px', right: '4px' }}></div>
          </div>

          {/* User metadata */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              @{selectedContact.username}
              {isFav && <Star size={18} fill="#eab308" stroke="#eab308" />}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isOnline ? 'Active Online' : selectedContact.statusText || 'Offline'}
            </p>
          </div>

          {/* Quick Action Button Grid */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '20px 0', width: '100%' }}>
            
            {/* Direct Message */}
            {!isBlocked && !isPending && (
              <button
                className="btn-primary"
                onClick={() => handleMessageContact(selectedContact._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
                }}
              >
                <MessageSquare size={15} /> Send Message
              </button>
            )}

            {/* Accept Request */}
            {isPending && (
              <button
                className="btn-primary"
                onClick={async () => {
                  await acceptRequest(selectedContact._id);
                  onClearSelection();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
              >
                <Check size={15} /> Accept Request
              </button>
            )}

            {/* Favorite toggle button */}
            {!isBlocked && !isPending && (
              <button
                className="btn-secondary"
                onClick={() => toggleFavorite(selectedContact._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', border: '1px solid var(--glass-border)' }}
              >
                <Star size={14} fill={isFav ? '#eab308' : 'none'} color={isFav ? '#eab308' : 'white'} />
                {isFav ? 'Favorited' : 'Add Favorite'}
              </button>
            )}
          </div>

          {/* Configuration Forms inside details */}
          {!isBlocked && !isPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', textAlign: 'left' }}>
              
              {/* Category picker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Relationship Category</span>
                <select
                  className="glass-input"
                  style={{ width: '140px', padding: '6px 12px', fontSize: '12px' }}
                  value={activeCat}
                  onChange={(e) => handleCategorize(selectedContact._id, e.target.value)}
                >
                  <option value="">None</option>
                  <option value="Friends">Friends 💬</option>
                  <option value="Work">Work 💼</option>
                  <option value="Family">Family 🏠</option>
                </select>
              </div>

              {/* Status and details block */}
              <div style={{ padding: '14px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BIOGRAPHY & NOTES</div>
                <div style={{ fontSize: '12.5px', color: 'white', lineHeight: '1.4' }}>
                  {selectedContact.statusText ? `"${selectedContact.statusText}"` : "This friend hasn't set their status bio yet."}
                </div>
              </div>

              {/* Advanced Privacy controls */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await blockUser(selectedContact._id);
                    onClearSelection();
                  }}
                  style={{ flex: 1, border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px' }}
                >
                  <Ban size={13} /> Block @{selectedContact.username}
                </button>
                
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await removeContact(selectedContact._id);
                    onClearSelection();
                  }}
                  style={{ flex: 1, border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px' }}
                >
                  <Trash2 size={13} /> Unfriend
                </button>
              </div>
            </div>
          )}

          {isBlocked && (
            <button
              className="btn-primary"
              onClick={async () => {
                await unblockUser(selectedContact._id);
                onClearSelection();
              }}
              style={{ padding: '10px 24px', fontSize: '12.5px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none', width: '100%' }}
            >
              Unblock Contact
            </button>
          )}

        </div>
      </div>
    );
  }

  // 2. DASHBOARD DASHBOARD OVERVIEW (DEFAULT VIEW WHEN NO SPECIFIC CONTACT IS SELECTED)
  return (
    <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '25px', animation: 'scaleUp 0.25s ease-out' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
        <Users className="text-cyan-glowing" size={24} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Connections & Directory Hub</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Configure contact rules, browse active friends directory, scan QR tokens, and approve friend requests.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* LEFT COLUMN: CONNECTION & QR CODE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SEARCH & ADD CONTACTS */}
          <div className="ai-section-box glow-purple" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={16} color="var(--accent-purple)" /> Search & Connect Directory
            </h3>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <input
                className="glass-input"
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '12.5px', flex: 1 }}
                required
              />
              <button className="btn-primary" type="submit" style={{ padding: '8px 14px', minWidth: '80px', boxShadow: 'none' }} disabled={searching}>
                {searching ? 'Search...' : 'Find'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '8px' }}>
                {searchResults.map((sr) => {
                  const isCurrentContact = contacts.some(c => c._id === sr._id);
                  const isPending = pendingRequests.some(r => r._id === sr._id);
                  const isSent = sentRequests.some(r => r._id === sr._id);
                  const isMe = sr._id === user.id;

                  return (
                    <div key={sr._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '500' }}>@{sr.username}</span>
                      {isMe ? (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>You</span>
                      ) : isCurrentContact ? (
                        <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>Connected</span>
                      ) : isSent ? (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Requested</span>
                      ) : isPending ? (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px', boxShadow: 'none' }} onClick={() => acceptRequest(sr._id)}>Accept</button>
                      ) : (
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', border: '1px solid var(--accent-purple)' }} onClick={() => sendRequest(sr._id)}>Add Friend</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QR CODE SYSTEM */}
          <div className="ai-section-box glow-cyan" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <QrCode size={16} color="var(--accent-cyan)" /> My Chattix QR signature
            </h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                {/* Emulated high-end QR bubble */}
                <div style={{ width: '80px', height: '80px', border: '3px double #1e1b4b', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                  {[...Array(64)].map((_, i) => (
                    <div key={i} style={{ width: '7px', height: '7px', background: (i % 4 === 0 || i % 6 === 0) ? '#1e1b4b' : 'transparent' }}></div>
                  ))}
                  <div style={{ position: 'absolute', top: '25px', left: '25px', width: '30px', height: '30px', background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: '1.5px solid white' }}>
                    <QrCode size={12} color="white" />
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Share signature with friends:</span>
                <code style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                  {user.username}
                </code>
                
                <form onSubmit={handleQrFriend} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Enter QR token code..."
                    value={qrFriendInput}
                    onChange={(e) => setQrFriendInput(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '11.5px', flex: 1 }}
                    required
                  />
                  <button className="btn-primary" type="submit" style={{ padding: '6px 10px', fontSize: '11px', boxShadow: 'none' }}>Scan</button>
                </form>
              </div>
            </div>
          </div>

          {/* CONTACT REQUESTS */}
          <div className="ai-section-box" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} /> Friend Requests Approval ({pendingRequests.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {pendingRequests.length === 0 ? (
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '15px 0' }}>No incoming contact requests.</span>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar-placeholder" style={{ width: '24px', height: '24px', fontSize: '9px' }}>{req.username.substring(0,2).toUpperCase()}</div>
                      <span style={{ fontSize: '12.5px', fontWeight: '500' }}>@{req.username}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', width: '26px', height: '26px' }} title="Accept Request" onClick={() => acceptRequest(req._id)}>
                        <Check size={14} />
                      </button>
                      <button className="icon-btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', width: '26px', height: '26px' }} title="Decline Request" onClick={() => rejectRequest(req._id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE DIRECTORY LIST & FAVORITES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* FAVORITE CONTACTS QUICK GRID */}
          <div className="ai-section-box glow-purple" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={16} color="#eab308" fill="#eab308" /> Favorite Directory
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {favoriteContacts.length === 0 ? (
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>No favorite friends pinned yet.</span>
              ) : (
                favoriteContacts.map((fav) => (
                  <div
                    key={fav._id}
                    className="glass-panel"
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '85px',
                      gap: '6px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div className="avatar-wrapper" style={{ width: '32px', height: '32px' }}>
                      {fav.profilePhoto ? (
                        <img className="avatar" src={fav.profilePhoto} alt={fav.username} />
                      ) : (
                        <div className="avatar-placeholder" style={{ fontSize: '11px' }}>{fav.username.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'white', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      @{fav.username}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE DIRECTORY PREVIEW LIST */}
          <div className="ai-section-box" style={{ margin: 0, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Active Friends Directory</h3>
              
              {/* Category selector pills */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['All', 'Friends', 'Work', 'Family'].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-btn ${selectedCategoryTab === tab ? 'active' : ''}`}
                    style={{ padding: '4px 8px', fontSize: '10.5px', borderRadius: '4px' }}
                    onClick={() => setSelectedCategoryTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Friend List Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', color: 'var(--text-muted)', gap: '8px' }}>
                  <Users size={20} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: '11.5px' }}>No contacts found in category: {selectedCategoryTab}</span>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isOnline = onlineUsers.includes(c._id);
                  const catMap = user?.contactCategories || {};
                  const activeCat = catMap[c._id] || '';
                  const isFav = favoriteContacts.some(f => f._id === c._id);

                  return (
                    <div
                      key={c._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--glass-border)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        transition: 'all 0.15s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-wrapper" style={{ width: '32px', height: '32px' }}>
                          {c.profilePhoto ? (
                            <img className="avatar" src={c.profilePhoto} alt={c.username} />
                          ) : (
                            <div className="avatar-placeholder" style={{ fontSize: '11px' }}>{c.username.substring(0,2).toUpperCase()}</div>
                          )}
                          <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            @{c.username}
                            {isFav && <Star size={11} fill="#eab308" stroke="#eab308" />}
                            {activeCat && (
                              <span style={{ fontSize: '9px', background: activeCat === 'Work' ? 'rgba(59,130,246,0.15)' : activeCat === 'Family' ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)', color: activeCat === 'Work' ? '#3b82f6' : activeCat === 'Family' ? '#10b981' : 'var(--accent-purple)', padding: '1px 5px', borderRadius: '3px' }}>
                                {activeCat}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {isOnline ? 'Active Online' : c.statusText || 'Offline'}
                          </div>
                        </div>
                      </div>

                      {/* Quick message trigger */}
                      <button
                        className="btn-secondary"
                        onClick={() => handleMessageContact(c._id)}
                        style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                      >
                        Message
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BLOCKED USERS */}
          <div className="ai-section-box" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
              <ShieldAlert size={16} /> Blocked Privacy Listings ({blockedUsers.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
              {blockedUsers.length === 0 ? (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No blocked users.</span>
              ) : (
                blockedUsers.map((bu) => (
                  <div key={bu._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '500' }}>@{bu.username}</span>
                    <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: '10.5px', border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => unblockUser(bu._id)}>
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
