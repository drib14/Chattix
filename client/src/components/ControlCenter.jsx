import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Shield,
  QrCode,
  LineChart,
  Lock,
  Eye,
  Ban,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Settings,
  AlertOctagon,
  Laptop
} from 'lucide-react';

export default function ControlCenter({ onClose }) {
  const {
    user,
    contacts,
    blockedUsers,
    unblockUser,
    changeUsername,
    updatePrivacy,
    categorizeContact,
    fetchActiveSessions,
    revokeSession,
    toggle2FA,
    fetchAdminAnalytics,
    toggleSuspendUser,
    fetchToxicityLogs,
    showToast,
    updateProfile,
    createChat,
    searchUsers
  } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // profile, 2fa, sessions, qr, admin
  const [loading, setLoading] = useState(false);

  // Profile Settings
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusText || '');
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhoto || '');

  // Privacy Settings
  const [lastSeenVal, setLastSeenVal] = useState(user?.privacySettings?.lastSeen || 'Everyone');
  const [onlineStatusVal, setOnlineStatusVal] = useState(user?.privacySettings?.onlineStatus || 'Everyone');
  const [readReceiptsVal, setReadReceiptsVal] = useState(user?.privacySettings?.readReceipts !== false);

  // 2FA states
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mockQrVisible, setMockQrVisible] = useState(false);

  // Sessions
  const [sessionList, setSessionList] = useState([]);

  // QR & Categories
  const [friendCategoryInput, setFriendCategoryInput] = useState('');
  const [selectedFriendForCat, setSelectedFriendForCat] = useState('');
  const [qrFriendInput, setQrFriendInput] = useState('');

  // Admin Analytics
  const [adminBypass, setAdminBypass] = useState(true); // Default visual bypass so user can explore easily!
  const [adminData, setAdminData] = useState(null);
  const [toxLogs, setToxLogs] = useState([]);

  // Fetch session list
  const loadSessions = async () => {
    const res = await fetchActiveSessions();
    if (res?.success) {
      setSessionList(res.sessions);
    }
  };

  // Fetch admin stats if applicable
  const loadAdminStats = async () => {
    const res = await fetchAdminAnalytics();
    if (res?.success) {
      setAdminData(res.analytics);
    }
    const toxRes = await fetchToxicityLogs();
    if (toxRes?.success) {
      setToxLogs(toxRes.flaggedMessages);
    }
  };

  useEffect(() => {
    loadSessions();
    if (user?.isAdmin || adminBypass) {
      loadAdminStats();
    }
  }, [activeTab, adminBypass]);

  // Submit Profile Change
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (newUsername.toLowerCase() !== user.username) {
      await changeUsername(newUsername);
    }
    // Update status and picture URL (handled via local state update Profile)
    await updateProfile(statusMessage, photoUrl);
    setLoading(false);
  };

  // Update Privacy changes
  const handlePrivacyChange = async (lastSeen, onlineStatus, readReceipts) => {
    await updatePrivacy(lastSeen, onlineStatus, readReceipts);
  };

  // 2FA toggler
  const handleToggle2FA = async (enable) => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      showToast('Please enter a 6-digit confirmation code.', 'error');
      return;
    }
    setLoading(true);
    const res = await toggle2FA(twoFactorCode, enable);
    setLoading(false);
    if (res?.success) {
      setTwoFactorCode('');
      setMockQrVisible(false);
    }
  };

  // Session Revocation
  const handleRevoke = async (id) => {
    await revokeSession(id);
    loadSessions();
  };

  // Contact categorization
  const handleCategorize = async (friendId, cat) => {
    await categorizeContact(friendId, cat);
    showToast('Contact categorization updated!', 'success');
  };

  // Emulated QR friendship creation
  const handleQrFriend = async (e) => {
    e.preventDefault();
    if (!qrFriendInput) return;
    const searchRes = await searchUsers(qrFriendInput);
    if (searchRes.success && searchRes.users.length > 0) {
      const found = searchRes.users[0];
      await createChat(false, [found._id]);
      showToast(`Instantly added contact via QR Code signature!`, 'success');
      setQrFriendInput('');
    } else {
      showToast('No user found matching that QR Code token.', 'error');
    }
  };

  // Admin Suspension Toggle
  const handleSuspend = async (userId) => {
    const res = await toggleSuspendUser(userId);
    if (res?.success) {
      loadAdminStats();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '850px', width: '90%', height: '80vh', display: 'flex', flexDirection: 'row', padding: 0, overflow: 'hidden' }}>
        
        {/* Left Side Navigation Sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
          <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings className="text-cyan-glowing" size={18} />
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>Control Center</h3>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '15px 10px' }}>
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => setActiveTab('profile')}
            >
              <User size={14} style={{ marginRight: '8px' }} /> Profile & Privacy
            </button>
            
            <button
              className={`tab-btn ${activeTab === '2fa' ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => setActiveTab('2fa')}
            >
              <Shield size={14} style={{ marginRight: '8px' }} /> Security & 2FA
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => setActiveTab('sessions')}
            >
              <Laptop size={14} style={{ marginRight: '8px' }} /> Active Sessions
            </button>
            
            <button
              className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => setActiveTab('qr')}
            >
              <QrCode size={14} style={{ marginRight: '8px' }} /> QR & Categories
            </button>

            {(user?.isAdmin || adminBypass) && (
              <button
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                style={{
                  justifyContent: 'flex-start',
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  color: 'var(--accent-purple)',
                  border: activeTab === 'admin' ? 'none' : '1px solid rgba(168,85,247,0.25)',
                  background: activeTab === 'admin' ? 'var(--accent-purple)' : 'rgba(168,85,247,0.05)',
                  marginTop: '15px'
                }}
                onClick={() => setActiveTab('admin')}
              >
                <LineChart size={14} style={{ marginRight: '8px' }} /> Admin Dashboard
              </button>
            )}
          </div>

          {/* Bypass switch footer */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <span>Admin Preview Bypass</span>
              <input
                type="checkbox"
                checked={adminBypass}
                onChange={(e) => setAdminBypass(e.target.checked)}
                style={{ accentColor: 'var(--accent-purple)' }}
              />
            </label>
          </div>
        </div>

        {/* Right Side Pane display */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 25px', borderBottom: '1px solid var(--glass-border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, textTransform: 'capitalize' }}>
              {activeTab === 'sessions' ? 'Device Sessions Logs' : activeTab === 'qr' ? 'Contact QR Codes' : activeTab === '2fa' ? 'Shield Security' : `${activeTab} Management`}
            </h2>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>

          <div style={{ flex: 1, padding: '25px' }}>
            
            {/* TABS 1: PROFILE & PRIVACY OPTIONS */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Chattix username</label>
                      <input
                        className="glass-input"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Status Bio text</label>
                      <input
                        className="glass-input"
                        type="text"
                        placeholder="Set a nice status..."
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                      />
                    </div>
                    <button className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
                      {loading ? 'Saving...' : 'Update Username'}
                    </button>
                  </div>
                  <div style={{ width: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div className="avatar-placeholder" style={{ width: '80px', height: '80px', fontSize: '32px', border: '2px solid var(--accent-cyan)' }}>
                      {user.username.substring(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online Presence</span>
                  </div>
                </form>

                {/* Privacy Configuration Switches */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={15} className="text-cyan-glowing" /> Privacy Preferences</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '13px', margin: 0 }}>Last Seen Visibility</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Who can see when you were last online</p>
                      </div>
                      <select
                        className="glass-input"
                        style={{ width: '140px', padding: '6px 10px' }}
                        value={lastSeenVal}
                        onChange={(e) => {
                          setLastSeenVal(e.target.value);
                          handlePrivacyChange(e.target.value, onlineStatusVal, readReceiptsVal);
                        }}
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Contacts">Contacts Only</option>
                        <option value="Nobody">Nobody</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '13px', margin: 0 }}>Live Online Presence</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Display online badge indicator when active</p>
                      </div>
                      <select
                        className="glass-input"
                        style={{ width: '140px', padding: '6px 10px' }}
                        value={onlineStatusVal}
                        onChange={(e) => {
                          setOnlineStatusVal(e.target.value);
                          handlePrivacyChange(lastSeenVal, e.target.value, readReceiptsVal);
                        }}
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Nobody">Hide Presence</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '13px', margin: 0 }}>Send Read Receipts</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Show double blue checks when reading messages</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={readReceiptsVal}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                        onChange={(e) => {
                          setReadReceiptsVal(e.target.checked);
                          handlePrivacyChange(lastSeenVal, onlineStatusVal, e.target.checked);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Blocked Directory */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Ban size={15} style={{ color: '#ef4444' }} /> Blocked Contacts ({blockedUsers?.length || 0})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                    {(!blockedUsers || blockedUsers.length === 0) ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '15px 0' }}>No blocked users listed.</p>
                    ) : (
                      blockedUsers.map((bu) => (
                        <div key={bu._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{bu.username.substring(0,2)}</div>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{bu.username}</span>
                          </div>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', border: '1px solid #ef4444', color: '#ef4444' }}
                            onClick={() => unblockUser(bu._id)}
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TABS 2: 2FA & ACCOUNT SECURITY */}
            {activeTab === '2fa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '16px', borderRadius: '12px', alignItems: 'flex-start' }}>
                  <Shield className="text-cyan-glowing" size={32} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--accent-cyan)' }}>Enhanced Identity Security</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      Enabling Two-Factor Authentication requires a unique 6-digit confirmation code from your authentication app every time you log in to Chattix, defending your account against unauthorized credential access.
                    </p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', margin: '0 0 2px 0' }}>Authenticator Setup Status</h4>
                      <span style={{ fontSize: '11px', color: user?.twoFactorEnabled ? 'var(--status-online)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                        ● {user?.twoFactorEnabled ? 'PROTECTED (2FA ACTIVE)' : 'UNSECURED (PASSWORD ONLY)'}
                      </span>
                    </div>
                    {!user?.twoFactorEnabled && !mockQrVisible && (
                      <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => setMockQrVisible(true)}>Setup 2FA</button>
                    )}
                  </div>

                  {(mockQrVisible || user?.twoFactorEnabled) && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', gap: '20px', animation: 'slideDown 0.2s ease-out' }}>
                      <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '130px', height: '130px' }}>
                        {/* Renders a beautiful mock visual QR code */}
                        <div style={{ width: '110px', height: '110px', border: '5px double #0f172a', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {[...Array(64)].map((_, i) => (
                            <div key={i} style={{ width: '9px', height: '9px', background: (i % 3 === 0 || i % 5 === 0) ? 'black' : 'transparent' }}></div>
                          ))}
                          <div style={{ position: 'absolute', top: '35px', left: '35px', width: '40px', height: '40px', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: '2px solid white' }}>
                            <Lock size={16} color="white" />
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px' }}>
                          <strong>Manual Secret Code:</strong> <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{user?.twoFactorSecret || 'CHAT-39F2-K893-SEC'}</code>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          Sandbox test: Enter <strong>"123456"</strong> to successfully verify and complete setup/logins!
                        </p>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                          <input
                            className="glass-input"
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            style={{ width: '150px', padding: '8px 12px' }}
                          />
                          {user?.twoFactorEnabled ? (
                            <button className="btn-secondary" style={{ border: '1px solid #ef4444', color: '#ef4444', padding: '8px 14px' }} onClick={() => handleToggle2FA(false)}>Disable 2FA</button>
                          ) : (
                            <button className="btn-primary" style={{ padding: '8px 14px' }} onClick={() => handleToggle2FA(true)}>Verify & Enable</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TABS 3: SESSION & DEVICE LOGGER */}
            {activeTab === 'sessions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Monitor and manage your active Chattix accounts across different browsers and computers. You can log out of other sessions remotely.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sessionList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>No active login records found.</div>
                  ) : (
                    sessionList.map((s) => {
                      const isCurrent = s.sessionId === localStorage.getItem('sessionId');
                      return (
                        <div
                          key={s._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            border: isCurrent ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--glass-border)',
                            boxShadow: isCurrent ? '0 0 10px rgba(6, 182, 212, 0.05)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isCurrent ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Laptop size={18} className={isCurrent ? 'text-cyan-glowing' : ''} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {s.deviceName || 'MERN Client Agent'}
                                {isCurrent && <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.15)', padding: '1px 6px', borderRadius: '4px' }}>This Device</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                IP Address: {s.ipAddress} • Active seen: {new Date(s.lastActive).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {!isCurrent && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}
                              onClick={() => handleRevoke(s.sessionId)}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TABS 4: QR CODE SHARE & CATEGORIES */}
            {activeTab === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ display: 'flex', gap: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  
                  {/* Share QR */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                      {/* Stylized communication QR Code */}
                      <div style={{ width: '130px', height: '130px', border: '4px double #1e1b4b', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {[...Array(64)].map((_, i) => (
                          <div key={i} style={{ width: '11px', height: '11px', background: (i % 4 === 0 || i % 7 === 0) ? '#1e1b4b' : 'transparent' }}></div>
                        ))}
                        <div style={{ position: 'absolute', top: '42px', left: '42px', width: '46px', height: '46px', background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '2px solid white' }}>
                          <QrCode size={20} color="white" />
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scan signature to message</span>
                  </div>

                  {/* Add QR input */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px 0' }}>Scan Friend's QR Code</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                      Enter your friend's unique QR Code signature below to instantly verify and connect.
                    </p>
                    
                    <form onSubmit={handleQrFriend} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        className="glass-input"
                        type="text"
                        placeholder="Paste QR Code signature (e.g. jhon)"
                        value={qrFriendInput}
                        onChange={(e) => setQrFriendInput(e.target.value)}
                        style={{ padding: '8px 12px' }}
                      />
                      <button className="btn-primary" type="submit" style={{ padding: '8px 14px' }}>Connect</button>
                    </form>
                  </div>
                </div>

                {/* Categorization controls */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Contact Categorization</h3>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select
                        className="glass-input"
                        style={{ flex: 1, padding: '8px' }}
                        value={selectedFriendForCat}
                        onChange={(e) => setSelectedFriendForCat(e.target.value)}
                      >
                        <option value="">-- Choose Contact --</option>
                        {contacts.map((c) => (
                          <option key={c._id} value={c._id}>{c.username}</option>
                        ))}
                      </select>
                      
                      <select
                        className="glass-input"
                        style={{ width: '130px', padding: '8px' }}
                        value={friendCategoryInput}
                        onChange={(e) => setFriendCategoryInput(e.target.value)}
                      >
                        <option value="">None (Default)</option>
                        <option value="Friends">Friends 💬</option>
                        <option value="Work">Work 💼</option>
                        <option value="Family">Family 🏠</option>
                      </select>

                      <button
                        className="btn-primary"
                        onClick={() => {
                          if (!selectedFriendForCat) return;
                          handleCategorize(selectedFriendForCat, friendCategoryInput);
                        }}
                        style={{ padding: '8px 14px' }}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TABS 5: HIGH-END ADMIN ANALYTICS */}
            {activeTab === 'admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', paddingBottom: '20px' }}>
                
                {/* Visual Widgets Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={20} color="var(--accent-purple)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Active Users</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{adminData?.activeOnline || 0} / {adminData?.totalUsers || 0}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={20} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Messages Logged</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{adminData?.totalMessagesSimulated || 0}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Tokens (This Week)</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{adminData?.aiTokenUsageTotal || '0'}</div>
                    </div>
                  </div>
                </div>

                {/* CSS Charts */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LineChart size={15} color="var(--accent-cyan)" /> Daily Platform Activity (Visual Engagement Curve)
                  </h3>
                  
                  {/* Styled CSS Bar/Line Graph */}
                  <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', padding: '10px 0' }}>
                    {adminData?.charts?.dau.map((val, idx) => {
                      const percentage = (val / Math.max(...adminData.charts.dau)) * 100;
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '110px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ height: `${percentage}%`, width: '100%', background: 'linear-gradient(to top, rgba(168,85,247,0.3) 0%, rgba(6,182,212,0.8) 100%)', borderRadius: '4px 4px 0 0', animation: 'growUp 0.6s ease-out' }}></div>
                            <span style={{ position: 'absolute', bottom: '6px', fontSize: '9px', fontWeight: 'bold', color: 'white' }}>{val}</span>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{adminData.charts.labels[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI toxicity scans & moderated harassment grid */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                    <AlertTriangle size={15} /> Flagged AI Toxicity Harassment logs
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {toxLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '15px' }}>No content violations caught.</div>
                    ) : (
                      toxLogs.map((log) => (
                        <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              {log.reason} ({Math.round(log.toxRating * 100)}% toxic)
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            "{log.content}"
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              Sender: <strong>@{log.sender}</strong> • Chat: {log.chatRoomName}
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '10px', border: '1px solid #f59e0b', color: '#f59e0b' }}
                                onClick={() => showToast(`Warning alert issued to sender @${log.sender}.`, 'info')}
                              >
                                Warn User
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '10px', border: '1px solid #ef4444', color: '#ef4444' }}
                                onClick={() => {
                                  // Suspend by searching user in the administrative grid list
                                  const target = adminData?.usersList?.find(u => u.username === log.sender);
                                  if (target) {
                                    handleSuspend(target._id);
                                  } else {
                                    showToast(`Simulated ban applied to ${log.sender}`, 'success');
                                  }
                                }}
                              >
                                Suspend Account
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Account Suspension Grid */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Registered Accounts & Suspensions Controls
                  </h3>
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {adminData?.usersList?.map((u) => (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>@{u.username} ({u.email})</span>
                          {u.isOnline && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-online)' }}></span>}
                          {u.isSuspended && <span style={{ fontSize: '9px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 5px', borderRadius: '3px' }}>Suspended</span>}
                        </div>
                        <button
                          className="btn-secondary"
                          style={{
                            padding: '3px 8px',
                            fontSize: '10.5px',
                            border: u.isSuspended ? '1px solid var(--accent-cyan)' : '1px solid #ef4444',
                            color: u.isSuspended ? 'var(--accent-cyan)' : '#ef4444'
                          }}
                          onClick={() => handleSuspend(u._id)}
                        >
                          {u.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// Simple icon package since Lucide doesn't export Users at top level in standard way
function Users({ size = 14, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
