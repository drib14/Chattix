import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  UsersRound,
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { authService } from '../services/authService';
import ChattixLogo from './ChattixLogo';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const ModernSidebar = ({ activeTab, setActiveTab, onClose, badges = {}, expanded = false }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showLabels = expanded;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Chats', badge: badges.chats },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'requests', icon: UserPlus, label: 'Requests', badge: badges.requests },
    { id: 'groups', icon: UsersRound, label: 'Groups' },
    { id: 'notifications', icon: Bell, label: 'Alerts', badge: badges.notifications },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div
      className={`h-full bg-chattix-sidebar border-r border-gray-200 flex flex-col shadow-sm w-full ${
        showLabels ? 'w-full' : 'w-20 lg:w-64'
      }`}
    >
      <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0">
        {showLabels && <ChattixLogo size="sm" className="mb-4" />}
        <button
          type="button"
          onClick={() => { navigate('/profile'); onClose?.(); }}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 min-w-0"
        >
          <img
            src={user?.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(user?.fullName || 'U')}`}
            alt={user?.fullName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-chattix-primary/30 shrink-0"
          />
          {showLabels && (
            <div className="min-w-0 text-left flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
            </div>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5 min-h-0">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-w-0 ${
                active ? 'bg-chattix-primary/10 text-chattix-secondary' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {showLabels && <span className="truncate">{item.label}</span>}
              {(item.badge || 0) > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 ${
                    showLabels ? 'ml-auto' : 'absolute top-1 right-1'
                  }`}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 shrink-0 safe-bottom">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 text-sm font-medium ${
            showLabels ? 'justify-start' : 'justify-center'
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default ModernSidebar;
