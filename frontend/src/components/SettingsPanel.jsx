import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  LogOut,
  Trash2,
  ArrowRight,
  Mail,
  AtSign,
  Eye,
  EyeOff,
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import { setLanguage, setChatTheme, CHAT_THEMES } from '../redux/slices/themeSlice';
import { t } from '../utils/translations';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';

const SettingsPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const { language, chatTheme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
    });
    if (!isConfirmed) return;

    setLoggingOut(true);
    try {
      await authService.logout();
      dispatch(logout());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      dispatch(logout());
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await userService.changePassword(passwordData);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const { confirm } = useConfirm();

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account permanently? This action cannot be undone and all your data will be lost.',
      confirmText: 'Delete Account',
      isDestructive: true,
    });
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      await userService.deleteAccount();
      dispatch(logout());
      toast.success('Account deleted');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">{t('settings', language)}</h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your Chattix account</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Chat Theme Selector */}
        <div className="modern-card !p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🎨</span>
            Chat Theme
          </h3>
          <p className="text-xs text-gray-500 mb-3">Changes wallpaper, bubble colors, and quick reaction</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(CHAT_THEMES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => dispatch(setChatTheme(key))}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  chatTheme === key
                    ? 'border-gray-900 bg-gray-50 shadow-md scale-[1.02]'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full shadow-sm"
                  style={{ background: t.gradient }}
                />
                <span className="text-[10px] font-medium text-gray-700 leading-tight text-center">
                  {t.emoji} {t.name}
                </span>
              </button>
            ))}
          </div>
          {/* Theme preview */}
          <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Preview</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-end">
                <div className="px-3 py-1.5 rounded-xl rounded-br-sm text-xs max-w-[70%]" style={{ backgroundColor: CHAT_THEMES[chatTheme]?.bubbleOwn, color: CHAT_THEMES[chatTheme]?.bubbleOwnText }}>
                  Hey! How are you? 👋
                </div>
              </div>
              <div className="flex justify-start">
                <div className="px-3 py-1.5 rounded-xl rounded-bl-sm text-xs max-w-[70%]" style={{ backgroundColor: CHAT_THEMES[chatTheme]?.bubbleOther, color: CHAT_THEMES[chatTheme]?.bubbleOtherText, border: '1px solid #f0f0f0' }}>
                  I'm great! {CHAT_THEMES[chatTheme]?.quickReaction}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Quick reaction: <span className="text-base">{CHAT_THEMES[chatTheme]?.quickReaction}</span></p>
          </div>
        </div>

        <div className="modern-card !p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User size={16} className="text-chattix-primary" />
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <AtSign size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Username</p>
                <p className="text-gray-900">@{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-gray-900 break-all">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="text-gray-900">{user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>



        <div className="modern-card !p-4 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full py-2.5 rounded-xl bg-chattix-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-chattix-primary-dark transition-colors"
          >
            <ArrowRight size={16} />
            Edit Profile
          </button>

          <button
            type="button"
            onClick={() => setShowPasswordForm((v) => !v)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Lock size={16} />
            {showPasswordForm ? 'Hide Password Form' : 'Change Password'}
          </button>

          {showPasswordForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleChangePassword}
              className="space-y-3 pt-2"
            >
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="modern-input pr-10 text-sm !py-2"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="New password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="modern-input pr-10 text-sm !py-2"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="modern-input text-sm !py-2"
                required
              />
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 rounded-xl bg-chattix-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </motion.form>
          )}
        </div>

        <div className="modern-card !p-4 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
