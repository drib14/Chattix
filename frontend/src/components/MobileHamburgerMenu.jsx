import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Settings, LogOut } from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { authService } from '../services/authService';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const MobileHamburgerMenu = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount: notifUnread } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMenuItemClick = (tab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - tap outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />

          {/* Drawer - slides in from RIGHT */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[min(280px,85vw)] max-w-full lg:hidden safe-bottom bg-white shadow-2xl rounded-l-2xl"
          >
            <div className="h-full flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
                <span className="text-sm font-semibold text-gray-900">Menu</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Section */}
              <div className="px-4 py-4 border-b border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={user?.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(user?.fullName || 'U')}`}
                    alt={user?.fullName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-chattix-primary/30 shrink-0"
                  />
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                  </div>
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto px-2 py-3">
                {/* Alerts */}
                <button
                  type="button"
                  onClick={() => handleMenuItemClick('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-chattix-primary/10 text-chattix-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bell size={18} className="shrink-0" />
                  <span className="flex-1 text-left">Alerts</span>
                  {notifUnread > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {notifUnread > 9 ? '9+' : notifUnread}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => handleMenuItemClick('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-chattix-primary/10 text-chattix-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings size={18} className="shrink-0" />
                  <span className="flex-1 text-left">Settings</span>
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-gray-100" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span className="flex-1 text-left">Logout</span>
                </button>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileHamburgerMenu;
