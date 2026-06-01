import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './components/Auth';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import AISidebar from './components/AISidebar';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import ContactsPage from './pages/ContactsPage';
import SecurityPage from './pages/SecurityPage';
import AIPage from './pages/AIPage';
import AdminPage from './pages/AdminPage';
import { MessageSquare, Users, Shield, Sparkles, LineChart, LogOut } from 'lucide-react';

function AppContent() {
  const { user, token, toast, fetchConversations, fetchContacts, currentChat, logoutUser } = useApp();
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [activePage, setActivePage] = useState('chats'); // chats, contacts, security, ai, admin
  
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
            title="Contacts & Requests Directory"
          >
            <Users size={18} />
          </button>
          
          <button
            className={`nav-dock-item accent-cyan ${activePage === 'security' ? 'active' : ''}`}
            onClick={() => setActivePage('security')}
            title="Security & Authenticator Hub"
          >
            <Shield size={18} />
          </button>
          
          <button
            className={`nav-dock-item accent-purple ${activePage === 'ai' ? 'active' : ''}`}
            onClick={() => setActivePage('ai')}
            title="Chattix AI Workspace"
          >
            <Sparkles size={18} />
          </button>

          <button
            className={`nav-dock-item accent-purple ${activePage === 'admin' ? 'active' : ''}`}
            onClick={() => setActivePage('admin')}
            title="Administration Analytics Console"
          >
            <LineChart size={18} />
          </button>
          
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
              showAISidebar={showAISidebar}
              setShowAISidebar={setShowAISidebar}
            />

            {/* Dynamic chat feed window */}
            <ChatWindow
              className={mobilePanel === 'chat' ? 'active' : ''}
              onBack={() => setMobilePanel('sidebar')}
              showAISidebar={showAISidebar}
              setShowAISidebar={setShowAISidebar}
            />

            {/* Sliding Chattix AI Sidebar */}
            <AISidebar
              className={showAISidebar ? 'active' : ''}
              onClose={() => setShowAISidebar(false)}
            />
          </>
        )}

        {activePage === 'contacts' && <ContactsPage />}
        {activePage === 'security' && <SecurityPage />}
        {activePage === 'ai' && <AIPage />}
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
