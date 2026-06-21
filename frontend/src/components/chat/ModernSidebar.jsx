import { useSelector, useDispatch } from 'react-redux';
import { useClerk } from '@clerk/clerk-react';
import { MessageSquare, Search, Users, User, LogOut } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { setSelectedChat } from '../../redux/slices/chatSlice';

const Logo = ({ className = "brand-logo-svg" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a5b4fc" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbcfe8" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="26" fill="url(#bgGrad)" />
    <path d="M 35 85 L 45 70 L 25 70 Z" fill="#6366f1" />
    <path d="M 30 30 Q 50 15 70 30" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.35" />
    <circle cx="70" cy="70" r="18" fill="url(#accentGrad)" />
    <path d="M 62 62 Q 70 54 78 62" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45" />
  </svg>
);

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
    <div className="sidebar-container clay-card">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="clay-logo-container">
          <Logo />
        </div>
        <span className="sidebar-logo-name">Chattix</span>
      </div>

      {/* Navigation Buttons */}
      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : ''}`}
              title={item.label}
            >
              <Icon size={20} />
              <span className="sidebar-btn-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`}
            alt="profile"
            className="sidebar-avatar"
          />
          <div className="sidebar-user-text">
            <p className="sidebar-name text-truncate">{user?.fullName}</p>
            <p className="sidebar-username text-truncate">@{user?.username}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="sidebar-logout-btn clay-btn" title="Sign Out">
          <LogOut size={16} />
          <span className="sidebar-logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ModernSidebar;

