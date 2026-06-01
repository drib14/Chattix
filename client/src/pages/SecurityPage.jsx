import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Laptop, Lock, AlertCircle, Trash2, User, Users, Camera, Check, Sparkles } from 'lucide-react';

export default function SecurityPage({ activeSection = 'profile' }) {
  const {
    user,
    fetchActiveSessions,
    revokeSession,
    toggle2FA,
    updateProfile,
    switchSavedAccount,
    showToast
  } = useApp();

  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Profile editing
  const [statusText, setStatusText] = useState(user?.statusText || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');

  // 2FA state management
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mockQrVisible, setMockQrVisible] = useState(false);

  // Saved accounts list
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Fetch all active sessions
  const loadSessions = async () => {
    setLoading(true);
    const res = await fetchActiveSessions();
    setLoading(false);
    if (res?.success) {
      setSessionList(res.sessions);
    }
  };

  // Fetch saved accounts from local storage
  const loadSavedAccounts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
      setSavedAccounts(stored);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSessions();
    loadSavedAccounts();
  }, []);

  // Update profile status & photo
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(statusText, profilePhoto);
      showToast('Profile preview saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error updating profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle 2FA Authenticator state
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
      loadSessions();
    }
  };

  // Revoke device session
  const handleRevoke = async (id) => {
    const res = await revokeSession(id);
    if (res?.success) {
      loadSessions();
    }
  };

  // Handle hot-swapping accounts
  const handleSwitchAccount = async (username) => {
    try {
      showToast(`Swapping to account @${username}...`, 'info');
      // Fetch credential info and swap context
      const success = await switchSavedAccount(username);
      if (success) {
        showToast(`Success! Swapped to @${username}`, 'success');
      } else {
        showToast(`Could not hot-swap to @${username}`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Swapping account failed.', 'error');
    }
  };

  return (
    <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '25px', animation: 'scaleUp 0.25s ease-out' }}>
      
      {/* 1. MY PROFILE SECTION */}
      {activeSection === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
            <User className="text-cyan-glowing" size={24} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>My Profile</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Update your status bubble text, bio details, and profile photo decal.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Form list */}
            <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)' }}>
              <div className="form-group">
                <label>Profile Status text</label>
                <input
                  className="glass-input"
                  type="text"
                  placeholder="What's on your mind? 💭"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Profile Photo URL</label>
                <input
                  className="glass-input"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                />
              </div>

              <button className="btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }} disabled={loading}>
                <Check size={16} /> {loading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>

            {/* Profile visual preview */}
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>LIVE PREVIEW CARD</div>
              <div className="avatar-wrapper" style={{ width: '80px', height: '80px' }}>
                {profilePhoto ? (
                  <img className="avatar" src={profilePhoto} alt={user?.username} style={{ border: '3.5px solid var(--accent-purple)' }} />
                ) : (
                  <div className="avatar-placeholder" style={{ fontSize: '24px', border: '3px solid var(--accent-purple)' }}>
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'CX'}
                  </div>
                )}
                <div className="status-indicator online" style={{ width: '16px', height: '16px', border: '3px solid var(--bg-secondary)' }}></div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>@{user?.username}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  {statusText ? `"${statusText}"` : '"No status active"'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TWO-FACTOR AUTHENTICATION */}
      {activeSection === '2fa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
            <Lock className="text-cyan-glowing" size={24} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Two-Factor Authentication (2FA)</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Manage secure verification codes for your login credentials.</p>
            </div>
          </div>

          <div className="ai-section-box glow-cyan" style={{ margin: 0, padding: '24px', maxWidth: '520px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 15px 0' }}>
              Two-Factor Authentication adds an extra layer of identity protection by requiring a 6-digit confirmation code from your authenticator app (like Google Authenticator) upon login.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</div>
                  <strong style={{ fontSize: '13px', color: user?.twoFactorEnabled ? 'var(--status-online)' : '#ef4444' }}>
                    ● {user?.twoFactorEnabled ? 'ENABLED (Protected)' : 'DISABLED (Unsecured)'}
                  </strong>
                </div>
                {!user?.twoFactorEnabled && !mockQrVisible && (
                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px', boxShadow: 'none' }} onClick={() => setMockQrVisible(true)}>Setup 2FA</button>
                )}
              </div>

              {(mockQrVisible || user?.twoFactorEnabled) && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '80px', height: '80px', border: '3px double #0f172a', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                        {[...Array(64)].map((_, i) => (
                          <div key={i} style={{ width: '7px', height: '7px', background: (i % 3 === 0 || i % 5 === 0) ? 'black' : 'transparent' }}></div>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authenticator Secret:</span>
                      <code style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                        {user?.twoFactorSecret || 'CHAT-39FD-SECRET'}
                      </code>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Enter code <strong>"123456"</strong> to test standard sandbox confirmation!
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <input
                      className="glass-input"
                      type="text"
                      placeholder="6-digit verification code..."
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '12px', flex: 1 }}
                    />
                    {user?.twoFactorEnabled ? (
                      <button className="btn-secondary" style={{ border: '1px solid #ef4444', color: '#ef4444', padding: '8px 12px', fontSize: '11.5px' }} onClick={() => handleToggle2FA(false)}>Disable</button>
                    ) : (
                      <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '11.5px', boxShadow: 'none' }} onClick={() => handleToggle2FA(true)}>Verify & Activate</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. DEVICE SESSIONS LOGS */}
      {activeSection === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
            <Laptop className="text-cyan-glowing" size={24} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Device Sessions Logs</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Monitor logged-in browser sessions, IPs, and immediately revoke unwanted connections.</p>
            </div>
          </div>

          <div className="ai-section-box" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Currently active login sessions:</span>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={loadSessions} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Logs'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {sessionList.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '12px' }}>
                  No active session logging traces found.
                </div>
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
                        background: 'rgba(255,255,255,0.01)',
                        border: isCurrent ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--glass-border)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        transition: 'all 0.15s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: isCurrent ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Laptop size={16} className={isCurrent ? 'text-cyan-glowing' : ''} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {s.deviceName || 'Web Session Client'}
                            {isCurrent && (
                              <span style={{ fontSize: '9px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '3px' }}>
                                This Device
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            IP: {s.ipAddress} • Seen: {new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          className="icon-btn"
                          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.05)', width: '28px', height: '28px' }}
                          title="Revoke and Logout Session"
                          onClick={() => handleRevoke(s.sessionId)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SAVED ACCOUNTS */}
      {activeSection === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
            <Users className="text-cyan-glowing" size={24} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Switch Saved Accounts</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Hot-swap between saved session credentials instantly without re-typing passwords.</p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>REGISTERED PROFILES</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Current Account */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(168,85,247,0.05)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar-placeholder" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                    {user?.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>@{user?.username}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-purple)' }}>Active session (Current)</div>
                  </div>
                </div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-online)' }}></div>
              </div>

              {/* Saved sessions list */}
              {savedAccounts.filter(acc => acc.username !== user.username).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No other saved profiles found. Use another device/browser to register saved entries.
                </div>
              ) : (
                savedAccounts.filter(acc => acc.username !== user.username).map((acc) => (
                  <div
                    key={acc.username}
                    onClick={() => handleSwitchAccount(acc.username)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar-placeholder" style={{ width: '32px', height: '32px', fontSize: '11px', background: 'rgba(255,255,255,0.1)' }}>
                        {acc.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>@{acc.username}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Click to swap sessions</div>
                      </div>
                    </div>
                    
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '10.5px', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                    >
                      Swap Profile
                    </button>
                  </div>
                ))
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
