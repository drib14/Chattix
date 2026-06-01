import React from 'react';
import { Shield, User, Lock, Laptop, Users, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SecuritySidebarMenu({ activeSection = 'profile', onSectionChange }) {
  const { user, logoutUser } = useApp();

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={14} />, desc: 'Status texts and avatar decals' },
    { id: '2fa', label: 'Two-Factor Auth', icon: <Lock size={14} />, desc: 'Configure 2FA identity lock' },
    { id: 'sessions', label: 'Device Sessions', icon: <Laptop size={14} />, desc: 'Track logged-in IPs & revokes' },
    { id: 'accounts', label: 'Saved Accounts', icon: <Users size={14} />, desc: 'Swap profiles hot-credentials' }
  ];

  return (
    <div className="sidebar glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.2s ease-out' }}>
      
      {/* Header */}
      <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Shield size={20} className="text-cyan-glowing" style={{ color: 'var(--accent-cyan)' }} />
          Settings
        </h2>
      </div>

      {/* Profile quick details card in sidebar */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)'
        }}>
          <div className="avatar-wrapper" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
            {user?.profilePhoto ? (
              <img className="avatar" src={user.profilePhoto} alt={user.username} />
            ) : (
              <div className="avatar-placeholder" style={{ fontSize: '12px' }}>
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'CX'}
              </div>
            )}
            <div className="status-indicator online"></div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{user?.username || 'user'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {user?.statusText || 'No status set'}
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px 8px 8px' }}>
          PREFERENCES
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`list-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                  transition: 'background 0.2s',
                  color: isActive ? 'var(--accent-cyan)' : 'white'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sign Out bottom slot */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
          <button
            onClick={logoutUser}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '12.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
