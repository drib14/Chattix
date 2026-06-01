import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './components/Auth';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import AISidebar from './components/AISidebar';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const { user, token, toast, fetchConversations, fetchContacts, currentChat } = useApp();
  const [showAISidebar, setShowAISidebar] = useState(false);
  
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

        {/* Sliding Gemini AI Sidebar */}
        <AISidebar
          className={showAISidebar ? 'active' : ''}
          onClose={() => setShowAISidebar(false)}
        />
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
