import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, MessageSquare, Search, Settings, ShieldAlert, ArrowRightLeft, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user } = useUser();
  const { signOut, openUserProfile, session, openSignIn } = useClerk();
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  useEffect(() => {
    if (user && session) {
      // Check if user is already saved
      const saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
      const isSaved = saved.some(acc => acc.clerkId === user.id);
      const dismissed = localStorage.getItem(`chattix_dismissed_save_${user.id}`);

      if (!isSaved && !dismissed) {
        setShowSaveBanner(true);
      }

      session.getToken().then((token) => {
        // Sync with backend (fire and forget)
        fetch(import.meta.env.VITE_API_URL + '/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.imageUrl,
          })
        }).catch(err => console.error("Failed to sync user:", err));
      });
    }
  }, [user, session]);

  const handleSaveAccount = () => {
    if (!user) return;
    const newAccount = {
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName || user.firstName,
      avatar: user.imageUrl,
    };

    const saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
    saved.push(newAccount);
    localStorage.setItem('chattix_saved_accounts', JSON.stringify(saved));
    setShowSaveBanner(false);
  };

  const handleDismissBanner = () => {
    if (user) {
      localStorage.setItem(`chattix_dismissed_save_${user.id}`, 'true');
    }
    setShowSaveBanner(false);
  };

  const handleSwitchAccount = () => {
    openSignIn();
  };

  return (
    <div className="flex h-screen bg-chattix-bg p-4 gap-4 relative overflow-hidden">

      {/* Save Account Banner */}
      <AnimatePresence>
        {showSaveBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass clay-card p-4 flex items-center gap-4 w-[90%] max-w-2xl border-l-4 border-chattix-teal"
          >
            <ShieldAlert className="text-chattix-teal w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Save your login info?</h4>
              <p className="text-sm text-gray-600">Save your account on this device for a quick, 1-click sign-in next time you visit Chattix.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDismissBanner} className="p-2 text-gray-400 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSaveAccount} className="clay-btn-teal flex items-center gap-1 px-4 py-2 text-sm">
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-80 glass clay-card flex flex-col overflow-hidden">
        {/* Header / Profile */}
        <div className="p-4 border-b border-gray-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => openUserProfile()}>
            <img src={user?.imageUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
            <div className="overflow-hidden">
              <h2 className="font-bold text-gray-800 truncate">{user?.fullName || 'User'}</h2>
              <p className="text-xs text-chattix-teal font-medium">My Account</p>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:bg-white rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-white/50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-chattix-teal/50 shadow-inner"
            />
          </div>
        </div>

        {/* Chat List Placeholder */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 bg-chattix-teal/10 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-chattix-teal" />
            </div>
            <p className="text-gray-500 text-sm">No conversations yet.<br/>Start chatting!</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100/50 flex flex-col gap-2">
          <button
            onClick={handleSwitchAccount}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Switch Account
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass clay-card flex flex-col items-center justify-center text-center p-8">
        <img src="/chattix-logo.png" alt="Chattix Logo" className="w-32 h-32 mb-6 opacity-80 drop-shadow-md" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Chattix</h1>
        <p className="text-gray-500 max-w-md">
          Experience seamless real-time messaging with a beautiful, soft UI. Select a conversation or start a new one to begin.
        </p>
      </div>

    </div>
  );
}
