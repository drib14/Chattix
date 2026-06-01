import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, Palette, Layers, Plus, Trash2, Key, Check, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import useSettingsDrawerStore from '../../store/settingsDrawerStore';
import useConfirmStore from '../../store/confirmStore';
import useChatStore from '../../store/chatStore';

const THEMES = [
  { name: 'Classic Blue', primary: '#0084FF', secondary: '#00c6ff', bg: '#0A0E17' },
  { name: 'Neon Purple', primary: '#9d4edd', secondary: '#c77dff', bg: '#100c1a' },
  { name: 'Emerald Glass', primary: '#10b981', secondary: '#34d399', bg: '#060f0e' },
  { name: 'Crimson Sunset', primary: '#f43f5e', secondary: '#fda4af', bg: '#17070f' },
  { name: 'Cyberpunk Gold', primary: '#f59e0b', secondary: '#fbbf24', bg: '#1c1917' },
];

const BACKGROUNDS = [
  { name: 'Glass Charcoal', gradient: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' },
  { name: 'Deep Nebula', gradient: 'linear-gradient(135deg, #0f0c20 0%, #15102a 50%, #06020f 100%)' },
  { name: 'Aurora Nights', gradient: 'linear-gradient(135deg, #041012 0%, #081d22 100%)' },
  { name: 'Midnight Violet', gradient: 'linear-gradient(135deg, #100b1e 0%, #161129 100%)' },
  { name: 'Abyss Ocean', gradient: 'linear-gradient(135deg, #050b14 0%, #0c1729 100%)' },
];

const SettingsDrawer = () => {
  const { user, login } = useAuthStore();
  const { isOpen, closeDrawer } = useSettingsDrawerStore();
  const { showConfirm } = useConfirmStore();
  const { setChats, setSelectedChat } = useChatStore();

  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile edit state
  const [username, setUsername] = useState(user?.username || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [updating, setUpdating] = useState(false);

  // Accounts state
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setProfilePic(user.profilePic || '');
      
      const accounts = localStorage.getItem('chattix_saved_accounts');
      let parsed = accounts ? JSON.parse(accounts) : [];
      
      const existsIdx = parsed.findIndex((acc) => acc._id === user._id);
      const accData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic || '',
        token: user.token,
      };

      if (existsIdx > -1) {
        parsed[existsIdx] = accData;
      } else {
        parsed.push(accData);
      }
      
      localStorage.setItem('chattix_saved_accounts', JSON.stringify(parsed));
      setSavedAccounts(parsed);
    }
  }, [user]);

  useEffect(() => {
    const accounts = localStorage.getItem('chattix_saved_accounts');
    if (accounts) {
      setSavedAccounts(JSON.parse(accounts));
    }
  }, [isOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
      };

      const { data } = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/profile`,
        { username, profilePic },
        config
      );

      login(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const changeThemePalette = (t) => {
    document.documentElement.style.setProperty('--color-primary', t.primary);
    document.documentElement.style.setProperty('--color-primary-hover', `${t.primary}ee`);
    document.documentElement.style.setProperty('--color-secondary', t.secondary);
    document.documentElement.style.setProperty('--color-bg-dark', t.bg);
    toast.success(`Theme set to ${t.name}`);
  };

  const changeChatBackground = (bg) => {
    document.documentElement.style.setProperty('--chat-bg-gradient', bg.gradient);
    toast.success(`Chat background set to ${bg.name}`);
  };

  const handleSwitchAccount = (targetAcc) => {
    if (targetAcc._id === user._id) {
      toast.error('You are already logged into this account');
      return;
    }

    showConfirm({
      title: 'Switch Account?',
      message: `Do you want to switch to "${targetAcc.username}"? This will reload your active chats and settings.`,
      type: 'info',
      confirmText: 'Switch Now',
      cancelText: 'Cancel',
      onConfirm: () => {
        login(targetAcc);
        setSelectedChat(null);
        setChats([]);
        toast.success(`Welcome back, ${targetAcc.username}!`);
        closeDrawer();
      },
    });
  };

  const handleRemoveAccount = (targetId, e) => {
    e.stopPropagation();
    
    if (targetId === user._id) {
      toast.error('Cannot remove the active account. Log out first.');
      return;
    }

    const filtered = savedAccounts.filter((acc) => acc._id !== targetId);
    setSavedAccounts(filtered);
    localStorage.setItem('chattix_saved_accounts', JSON.stringify(filtered));
    toast.success('Account removed from saved list');
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      toast.error('Please fill all login fields');
      return;
    }

    setLoggingIn(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        { email: newEmail, password: newPassword },
        { withCredentials: true }
      );

      const newSaved = [...savedAccounts];
      const accData = {
        _id: data._id,
        username: data.username,
        email: data.email,
        profilePic: data.profilePic || '',
        token: data.token,
      };

      const existsIdx = newSaved.findIndex((acc) => acc._id === data._id);
      if (existsIdx > -1) {
        newSaved[existsIdx] = accData;
      } else {
        newSaved.push(accData);
      }

      localStorage.setItem('chattix_saved_accounts', JSON.stringify(newSaved));
      setSavedAccounts(newSaved);

      login(data);
      setSelectedChat(null);
      setChats([]);

      toast.success(`Account added and switched to ${data.username}!`);
      setShowAddAccountForm(false);
      setNewEmail('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
            className="relative w-full max-w-md bg-neutral-950/95 border-r border-neutral-900 backdrop-blur-2xl text-white h-full flex flex-col z-10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[var(--color-primary)]">
                <Settings size={22} className="animate-spin-slow" />
                <h2 className="text-xl font-bold text-white">Chattix Settings</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-900 bg-neutral-900/30 p-2 space-x-1">
              <button
                onClick={() => { setActiveTab('profile'); setShowAddAccountForm(false); }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'profile' ? 'bg-[var(--color-primary)] text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab('appearance'); setShowAddAccountForm(false); }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'appearance' ? 'bg-[var(--color-primary)] text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Palette size={16} />
                <span>Theme</span>
              </button>
              <button
                onClick={() => { setActiveTab('accounts'); setShowAddAccountForm(false); }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'accounts' ? 'bg-[var(--color-primary)] text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Layers size={16} />
                <span>Accounts</span>
              </button>
            </div>

            {/* Drawer Body content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <div className="w-24 h-24 rounded-full border-2 border-[var(--color-primary)] flex items-center justify-center bg-neutral-800 text-3xl font-bold overflow-hidden shadow-lg shadow-[var(--color-primary)]/10">
                      {profilePic ? (
                        <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.[0]
                      )}
                    </div>
                    <span className="text-xs text-neutral-400">Database Registered User</span>
                  </div>

                  {/* Username field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-neutral-300">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 placeholder-neutral-600 transition-all text-sm"
                    />
                  </div>

                  {/* Profile Picture field */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-neutral-300">Profile Picture URL</label>
                    <input
                      type="text"
                      placeholder="Paste picture URL..."
                      value={profilePic}
                      onChange={(e) => setProfilePic(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 placeholder-neutral-600 transition-all text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold transition-all shadow-lg shadow-[var(--color-primary)]/15 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-4"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Profile changes</span>
                    )}
                  </button>
                </form>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme selection */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Palette size={16} className="text-[var(--color-primary)]" />
                      <span>Premium Accent Palettes</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map((theme) => (
                        <div
                          key={theme.name}
                          onClick={() => changeThemePalette(theme)}
                          className="p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 rounded-2xl cursor-pointer hover:border-[var(--color-primary)]/20 transition-all flex flex-col space-y-2 group"
                        >
                          <div className="flex space-x-1.5">
                            <span
                              className="w-4 h-4 rounded-full block border border-white/10"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full block border border-white/10"
                              style={{ backgroundColor: theme.secondary }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-neutral-400 group-hover:text-white">
                            {theme.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customizable chat bg selection */}
                  <div className="space-y-3 pt-3 border-t border-neutral-900">
                    <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Layers size={16} className="text-[var(--color-primary)]" />
                      <span>Chat Background Gradients</span>
                    </h3>
                    <div className="space-y-2">
                      {BACKGROUNDS.map((bg) => (
                        <div
                          key={bg.name}
                          onClick={() => changeChatBackground(bg)}
                          className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer hover:border-[var(--color-primary)]/30 transition-all flex items-center space-x-3.5 group"
                        >
                          <div
                            className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0"
                            style={{ background: bg.gradient }}
                          />
                          <span className="text-xs font-bold text-neutral-300 group-hover:text-white">
                            {bg.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'accounts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Saved Accounts
                    </h3>
                    {!showAddAccountForm && (
                      <button
                        onClick={() => setShowAddAccountForm(true)}
                        className="text-xs font-semibold text-[var(--color-primary)] hover:text-white flex items-center space-x-1 hover:bg-neutral-900/50 p-1.5 px-2.5 border border-neutral-800 hover:border-neutral-700 rounded-xl transition cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Account</span>
                      </button>
                    )}
                  </div>

                  {/* Add Account subform */}
                  {showAddAccountForm && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      onSubmit={handleAddAccount}
                      className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-3.5"
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-neutral-300">Add Session Account</span>
                        <button
                          type="button"
                          onClick={() => setShowAddAccountForm(false)}
                          className="p-0.5 rounded-full hover:bg-neutral-800 text-neutral-400"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="email"
                          placeholder="Email address..."
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 placeholder-neutral-700 text-xs transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <input
                          type="password"
                          placeholder="Password..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 placeholder-neutral-700 text-xs transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loggingIn}
                        className="w-full py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        {loggingIn ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <Key size={14} />
                            <span>Save and Switch</span>
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}

                  {/* Saved Accounts list */}
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {savedAccounts.map((acc) => {
                      const isActive = acc._id === user._id;
                      return (
                        <div
                          key={acc._id}
                          onClick={() => handleSwitchAccount(acc)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition-all ${
                            isActive
                              ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20'
                              : 'bg-neutral-900 border-neutral-900 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                              {acc.profilePic ? (
                                <img src={acc.profilePic} alt="" className="w-full h-full object-cover" />
                              ) : (
                                acc.username[0]
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white flex items-center space-x-1.5">
                                <span>{acc.username}</span>
                                {isActive && (
                                  <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-400 truncate max-w-[180px]">
                                {acc.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isActive && <Check size={16} className="text-[var(--color-primary)] mr-1" />}
                            <button
                              onClick={(e) => handleRemoveAccount(acc._id, e)}
                              className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-red-500 transition-all cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsDrawer;
