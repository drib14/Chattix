import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Laptop, Lock, AlertCircle, Trash2 } from 'lucide-react';

export default function SecurityPage() {
  const {
    user,
    fetchActiveSessions,
    revokeSession,
    toggle2FA,
    showToast
  } = useApp();

  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2FA state management
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mockQrVisible, setMockQrVisible] = useState(false);

  // Fetch all active sessions
  const loadSessions = async () => {
    setLoading(true);
    const res = await fetchActiveSessions();
    setLoading(false);
    if (res?.success) {
      setSessionList(res.sessions);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

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

  return (
    <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '25px', animation: 'scaleUp 0.25s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
        <Shield className="text-cyan-glowing" size={24} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Security & 2FA Control</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Configure 2FA locks, monitor login IPs, and manage active device sessions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* LEFT COLUMN: TWO FACTOR AUTHENTICATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="ai-section-box glow-cyan" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} color="var(--accent-cyan)" /> Two-Factor Authentication (2FA)
            </h3>
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

          <div style={{ display: 'flex', gap: '10px', background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.2)', padding: '15px', borderRadius: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>Device Session Revocation Alerts</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Revoking other active login instances forces an immediate session token removal and redirects remote clients back to the authentication screen.
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SESSION HISTORY / LOGINS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="ai-section-box" style={{ margin: 0, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Laptop size={16} /> Device Sessions Logs ({sessionList.length})
              </h3>
              <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '10.5px' }} onClick={loadSessions} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px' }}>
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

      </div>

    </div>
  );
}
