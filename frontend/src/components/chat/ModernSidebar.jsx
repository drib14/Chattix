import { useSelector, useDispatch } from 'react-redux';
import { useClerk } from '@clerk/clerk-react';
import { MessageSquare, Search, Users, User, LogOut } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { setSelectedChat } from '../../redux/slices/chatSlice';

const ModernSidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useSelector((state) => state.auth);
  const { signOut } = useClerk();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Clerk signOut warning:', e);
    }
    dispatch(logout());
    dispatch(setSelectedChat(null));
    window.location.href = '/login';
  };

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div style={styles.container} className="clay-card">
      {/* Brand Header */}
      <div style={styles.header}>
        <div style={styles.logoBox}>
          <svg style={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span style={styles.logoName}>Chattix</span>
      </div>

      {/* Navigation Buttons */}
      <div style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navBtn,
                ...(isActive ? styles.navBtnActive : {}),
              }}
              title={item.label}
            >
              <Icon size={20} style={isActive ? { color: 'var(--clay-primary)' } : {}} />
              <span style={{
                ...styles.btnLabel,
                ...(isActive ? styles.btnLabelActive : {}),
              }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`}
            alt="profile"
            style={styles.avatar}
          />
          <div style={styles.userText}>
            <p style={styles.name} className="text-truncate">{user?.fullName}</p>
            <p style={styles.username} className="text-truncate">@{user?.username}</p>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn} className="clay-btn clay-btn-secondary" title="Sign Out">
          <LogOut size={16} />
          <span style={styles.logoutText}>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    padding: '24px 16px',
    borderRadius: '24px',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  logoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'var(--clay-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--clay-shadow-button)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  logoIcon: {
    width: '20px',
    height: '20px',
    color: '#ffffff',
  },
  logoName: {
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    color: 'var(--text-secondary)',
  },
  navBtnActive: {
    background: 'var(--clay-primary-light)',
    boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.02), inset 0 2px 4px rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    color: 'var(--clay-primary)',
    fontWeight: 700,
  },
  btnLabel: {
    fontSize: '14px',
    fontWeight: 500,
  },
  btnLabelActive: {
    fontWeight: 700,
  },
  footer: {
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingLeft: '8px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: '#f1f5f9',
    border: '1.5px solid var(--clay-primary-light)',
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  username: {
    fontSize: '11px',
    color: 'var(--text-light)',
    marginTop: '1px',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '14px',
    fontSize: '13px',
    color: 'var(--clay-danger)',
    borderColor: 'var(--clay-danger-light)',
  },
  logoutText: {
    fontWeight: 600,
  },
};

export default ModernSidebar;
