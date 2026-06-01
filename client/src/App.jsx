import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './components/Auth';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import ContactsPage from './pages/ContactsPage';
import SecurityPage from './pages/SecurityPage';
import AdminPage from './pages/AdminPage';
import StoriesPage from './pages/StoriesPage';
import MarketplacePage from './pages/MarketplacePage';
import { MessageSquare, Users, BookOpen, Store, Shield, LineChart, LogOut } from 'lucide-react';

function AppContent() {
  const { user, token, toast, fetchConversations, fetchContacts, currentChat, logoutUser } = useApp();
  const [activePage, setActivePage] = useState('chats'); // chats, contacts, stories, marketplace, security, admin
  
  // Visual Polish Loaders
  const [splashLoading, setSplashLoading] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  
  // Mobile panel toggle state (sidebar, chat)
  const [mobilePanel, setMobilePanel] = useState('sidebar');

  // Splash Screen Lifecycle
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setFadeOutSplash(true);
      const exitTimer = setTimeout(() => {
        setSplashLoading(false);
      }, 400); // Matches CSS transition duration
      return () => clearTimeout(exitTimer);
    }, 1800);

    return () => clearTimeout(splashTimer);
  }, []);

  // Marketplace purchase pivot event listener
  useEffect(() => {
    const handlePivotToChats = () => {
      setActivePage('chats');
    };
    window.addEventListener('pivot_to_chats', handlePivotToChats);
    return () => window.removeEventListener('pivot_to_chats', handlePivotToChats);
  }, []);

  // Sync initial fetching
  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchContacts();
    }
  }, [token]);

  // Automatically transition panel focus to active chat when a conversation is chosen on mobile
  useEffect(() => {
    if (currentChat) {
      setMobilePanel('chat');
    } else {
      setMobilePanel('sidebar');
    }
  }, [currentChat]);

  if (splashLoading) {
    return <SplashScreen fadeOut={fadeOutSplash} />;
  }

  if (!token || !user) {
    return <Auth />;
  }

  return (
    <div className="app-wrapper">
      {/* Centralized Toast System */}
      {toast.show && (
        <div className={`toast-alert ${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : ''}`}>
          <span>{toast.text}</span>
        </div>
      )}

      <div className="chat-layout">
        {/* Navigation Sidebar Dock */}
        <div className="nav-dock">
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
            <Logo size={28} />
          </div>
          
          <button
            className={`nav-dock-item accent-purple ${activePage === 'chats' ? 'active' : ''}`}
            onClick={() => setActivePage('chats')}
            title="Chats & Conversations"
          >
            <MessageSquare size={18} />
          </button>
          
          <button
            className={`nav-dock-item accent-cyan ${activePage === 'contacts' ? 'active' : ''}`}
            onClick={() => setActivePage('contacts')}
            title="People & Friends"
          >
            <Users size={18} />
          </button>

          <button
            className={`nav-dock-item accent-purple ${activePage === 'stories' ? 'active' : ''}`}
            onClick={() => setActivePage('stories')}
            title="Stories Deck"
          >
            <BookOpen size={18} />
          </button>

          <button
            className={`nav-dock-item accent-cyan ${activePage === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActivePage('marketplace')}
            title="Marketplace replica"
          >
            <Store size={18} />
          </button>
          
          <button
            className={`nav-dock-item accent-cyan ${activePage === 'security' ? 'active' : ''}`}
            onClick={() => setActivePage('security')}
            title="Security & Authenticator Hub"
          >
            <Shield size={18} />
          </button>
          
          {/* AI Workspace tab removed */}

          {user?.isAdmin && (
            <button
              className={`nav-dock-item accent-purple ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
              title="Administration Analytics Console"
            >
              <LineChart size={18} />
            </button>
          )}
          
          <div style={{ flex: 1 }}></div>

          <button
            className="nav-dock-item"
            onClick={logoutUser}
            title="Sign Out Session"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Dynamic workspace area depending on activePage state */}
        {activePage === 'chats' && (
          <>
            {/* Sidebar displaying conversations & contacts directory */}
            <ChatList
              className={mobilePanel === 'chat' ? 'mobile-hide' : ''}
            />

            {/* Dynamic chat feed window */}
            <ChatWindow
              className={mobilePanel === 'chat' ? 'active' : ''}
              onBack={() => setMobilePanel('sidebar')}
            />
          </>
        )}

        {activePage === 'contacts' && <ContactsPage />}
        {activePage === 'stories' && <StoriesPage />}
        {activePage === 'marketplace' && <MarketplacePage />}
        {activePage === 'security' && <SecurityPage />}
        {activePage === 'admin' && <AdminPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
