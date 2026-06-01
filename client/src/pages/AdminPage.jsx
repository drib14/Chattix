import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart, ShieldAlert, Activity, Globe, AlertTriangle, RefreshCw, Users } from 'lucide-react';

export default function AdminPage() {
  const {
    user,
    fetchAdminAnalytics,
    toggleSuspendUser,
    fetchToxicityLogs,
    showToast
  } = useApp();

  const [adminBypass, setAdminBypass] = useState(true); // default true so user can explore easily!
  const [adminData, setAdminData] = useState(null);
  const [toxLogs, setToxLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    const res = await fetchAdminAnalytics();
    if (res?.success) {
      setAdminData(res.analytics);
    }
    const toxRes = await fetchToxicityLogs();
    if (toxRes?.success) {
      setToxLogs(toxRes.flaggedMessages);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [adminBypass]);

  const handleSuspend = async (userId) => {
    const res = await toggleSuspendUser(userId);
    if (res?.success) {
      loadStats();
    }
  };

  return (
    <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '25px', animation: 'scaleUp 0.25s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LineChart className="text-cyan-glowing" size={24} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Administration Console</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Monitor engagement metrics, audit automatically flagged toxic content, and manage account suspensions.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <span>Bypass Admin Checks</span>
            <input
              type="checkbox"
              checked={adminBypass}
              onChange={(e) => setAdminBypass(e.target.checked)}
              style={{ accentColor: 'var(--accent-purple)' }}
            />
          </label>
          <button className="icon-btn" title="Refresh Stats" onClick={loadStats} disabled={loading || (!user?.isAdmin && !adminBypass)}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 2s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {(!user?.isAdmin && !adminBypass) ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.25)' }}>
            <ShieldAlert size={40} color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Restricted Access Layer</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            You do not possess the required administrator privileges to view this page. If this is an error, please request role updates from the database administrator.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            To inspect this restricted panel for testing, check the <strong>"Bypass Admin Checks"</strong> switch in the header top right!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ROW 1: ANALYTICS WIDGETS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simulated Messages Volume</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{adminData?.totalMessagesSimulated || 0}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Tokens (This Week)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{adminData?.aiTokenUsageTotal || '0'}</div>
              </div>
            </div>
          </div>

          {/* ROW 2: VISUAL CHART */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LineChart size={15} color="var(--accent-cyan)" /> Daily Active Users & Engagement Graphs
            </h3>
            
            <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', padding: '10px 0' }}>
              {adminData?.charts?.dau.map((val, idx) => {
                const maxVal = Math.max(...adminData.charts.dau, 1);
                const percentage = (val / maxVal) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '110px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: `${percentage}%`, width: '100%', background: 'linear-gradient(to top, rgba(168,85,247,0.3) 0%, rgba(6,182,212,0.8) 100%)', borderRadius: '4px 4px 0 0', animation: 'growUp 0.6s ease-out' }}></div>
                      <span style={{ position: 'absolute', bottom: '6px', fontSize: '9px', fontWeight: 'bold', color: 'white', zIndex: 1 }}>{val}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{adminData.charts.labels[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* TOXICITY MODERATION LOGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                <AlertTriangle size={15} /> Flagged Toxicity Harassment logs
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {toxLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', padding: '30px 0', border: '1px dashed var(--glass-border)', borderRadius: '10px' }}>
                    No content violations caught by the spam checker.
                  </div>
                ) : (
                  toxLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {log.reason} ({Math.round(log.toxRating * 100)}% toxic)
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        "{log.content}"
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Sender: <strong>@{log.sender}</strong> • Room: {log.chatRoomName}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '9.5px', border: '1px solid #f59e0b', color: '#f59e0b' }}
                            onClick={() => showToast(`Warning alert issued to sender @${log.sender}.`, 'info')}
                          >
                            Warn
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '9.5px', border: '1px solid #ef4444', color: '#ef4444' }}
                            onClick={() => {
                              const target = adminData?.usersList?.find(u => u.username === log.sender);
                              if (target) {
                                handleSuspend(target._id);
                              } else {
                                showToast(`Simulated ban applied to @${log.sender}`, 'success');
                              }
                            }}
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* USER MANAGEMENT & BANS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} /> Registered Accounts & Suspensions
              </h3>

              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', maxHeight: '300px', overflowY: 'auto' }}>
                {adminData?.usersList?.map((u) => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          @{u.username}
                          {u.isOnline && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-online)' }}></span>}
                        </span>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{u.email}</span>
                      </div>
                      {u.isSuspended && <span style={{ fontSize: '8.5px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 4px', borderRadius: '3px' }}>Suspended</span>}
                    </div>
                    
                    <button
                      className="btn-secondary"
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
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
        </div>
      )}
    </div>
  );
}
