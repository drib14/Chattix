import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, MessageSquare, Settings, ShieldAlert, ArrowRightLeft, Check, X, Phone, Video, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveConversation } from '../../store/chatSlice';
import SidebarSearch from './SidebarSearch';
import ConversationList from './ConversationList';
import ChatArea from '../chat/ChatArea';
import ChatInput from '../chat/ChatInput';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../../contexts/AuthContext';
import SwitchAccountModal from '../modals/SwitchAccountModal';

export default function Dashboard() {
  const { dbUser, logout } = useAppAuth();
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const activeConversation = useSelector(state => state.chat.activeConversation);
  const conversations = useSelector(state => state.chat.conversations);

  // Sync URL conversationId with Redux activeConversation
  useEffect(() => {
    const fetchAndSetConversation = async () => {
      if (!conversationId) {
        dispatch(setActiveConversation(null));
        return;
      }

      // If we already have it in the list, just set it
      const existingConv = conversations.find(c => c._id === conversationId);
      if (existingConv) {
        dispatch(setActiveConversation(existingConv));
        return;
      }

      // If we navigated to a new chat (e.g., from search) and it's not yet in the Redux list,
      // we need to fetch all conversations to populate it so Redux can see it.
      const token = localStorage.getItem('chattix_token');
      if (token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            // Find the active one from the newly fetched data and dispatch
            const conv = data.find(c => c._id === conversationId);
            if (conv) {
              dispatch(setActiveConversation(conv));
            }
          }
        } catch (e) {
          console.error("Failed to load conversation from URL", e);
        }
      }
    };

    fetchAndSetConversation();
  }, [conversationId, conversations, dispatch]);

  useEffect(() => {
    if (dbUser) {
      // Check if user is already saved locally
      const saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
      const isSaved = saved.some(acc => acc._id === dbUser._id);
      const dismissed = localStorage.getItem(`chattix_dismissed_save_${dbUser._id}`);

      if (!isSaved && !dismissed) {
        setShowSaveBanner(true);
      }
    }
  }, [dbUser]);

  const handleSaveAccount = () => {
    if (!dbUser) return;
    const newAccount = {
      _id: dbUser._id,
      email: dbUser.email,
      username: dbUser.username,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
      avatar: dbUser.profileImageUrl,
      token: localStorage.getItem('chattix_token')
    };

    let saved = JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
    // Filter out if this account already exists to prevent duplicate cards
    saved = saved.filter(acc => acc._id !== dbUser._id);
    saved.push(newAccount);

    localStorage.setItem('chattix_saved_accounts', JSON.stringify(saved));
    setShowSaveBanner(false);
  };

  const handleDismissBanner = () => {
    if (dbUser) {
      localStorage.setItem(`chattix_dismissed_save_${dbUser._id}`, 'true');
    }
    setShowSaveBanner(false);
  };

  const handleSwitchAccount = () => {
    setShowSwitchModal(true);
  };

  return (
    <div className="flex h-screen bg-chattix-bg p-4 gap-4 relative overflow-hidden">
      <SwitchAccountModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />

      {/* Save Account Banner */}
      <AnimatePresence>
        {showSaveBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 clay-card p-4 flex items-center gap-4 w-[90%] max-w-2xl border-l-4 border-l-chattix-teal"
          >
            <ShieldAlert className="text-chattix-teal w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Save your login info?</h4>
              <p className="text-sm text-gray-600">Save your account on this device for a quick, 1-click sign-in next time you visit Chattix.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDismissBanner} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors clay-btn">
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
      <div className="w-80 clay-card flex flex-col overflow-hidden">
        {/* Header / Profile */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <img src={dbUser?.profileImageUrl || '/chattix-logo.png'} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm group-hover:scale-105 transition-transform object-cover" />
            <div className="overflow-hidden">
              <h2 className="font-bold text-gray-800 truncate">{dbUser?.firstName} {dbUser?.lastName}</h2>
              <p className="text-xs text-chattix-teal font-medium">My Account</p>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:bg-white rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 z-20">
          <SidebarSearch onSelectUser={async (selectedUser) => {
             // Create or get conversation
             try {
                const token = localStorage.getItem('chattix_token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/conversations`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ participantId: selectedUser._id })
                });
                const conv = await res.json();
                navigate(`/c/${conv._id}`);
             } catch(e) { console.error(e); }
          }} />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          <ConversationList />
        </div>

        {/* Footer Actions */}
        <div className="p-4 flex flex-col gap-2">
          <button
            onClick={handleSwitchAccount}
            className="clay-btn flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium text-gray-600 hover:text-chattix-teal transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Switch Account
          </button>
          <button
            onClick={logout}
            className="clay-btn flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 clay-card flex flex-col overflow-hidden relative">
        {activeConversation ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="h-20 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {(() => {
                  const otherParticipant = activeConversation.participants.find(p => String(p._id) !== String(dbUser?._id)) || activeConversation.participants[0];
                  return (
                    <>
                      <div className="relative">
                        <img src={otherParticipant.profileImageUrl || '/chattix-logo.png'} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        {otherParticipant.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 leading-tight">{otherParticipant.firstName} {otherParticipant.lastName}</h3>
                        <p className="text-xs text-gray-500">{otherParticipant.isOnline ? 'Active now' : 'Offline'}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-chattix-teal hover:bg-chattix-teal/10 rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-chattix-teal hover:bg-chattix-teal/10 rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-chattix-teal hover:bg-chattix-teal/10 rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <ChatArea />

            {/* Input Area */}
            <ChatInput />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <img src="/chattix-logo.png" alt="Chattix Logo" className="w-48 h-48 mb-6 opacity-80 drop-shadow-md object-contain" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Chattix</h1>
            <p className="text-gray-500 max-w-md">
              Experience seamless real-time messaging with a beautiful, soft UI. Select a conversation or start a new one to begin.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
