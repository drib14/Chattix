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

// Import newly created modular sidebars
import ContactsSidebarList from './components/ContactsSidebarList';
import StoriesSidebarList from './components/StoriesSidebarList';
import MarketplaceSidebarFilters from './components/MarketplaceSidebarFilters';
import SecuritySidebarMenu from './components/SecuritySidebarMenu';

import { MessageSquare, Users, BookOpen, Store, Shield, LineChart, LogOut } from 'lucide-react';

function AppContent() {
  const { user, token, toast, fetchConversations, fetchContacts, currentChat, logoutUser } = useApp();
  const [activePage, setActivePage] = useState('chats'); // chats, contacts, stories, marketplace, security, admin
  
  // Shared States for Three-Pane Syncing
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [activeStoryUserIndex, setActiveStoryUserIndex] = useState(null);
  
  const [marketCategory, setMarketCategory] = useState('All');
  const [marketSearch, setMarketSearch] = useState('');
  const [marketPriceRange, setMarketPriceRange] = useState({ min: '', max: '' });
  
  const [settingsSection, setSettingsSection] = useState('profile');
  
  // Modals status triggers
  const [postStoryModalOpen, setPostStoryModalOpen] = useState(false);
  const [sellItemModalOpen, setSellItemModalOpen] = useState(false);

  // Visual Polish Loaders
  const [splashLoading, setSplashLoading] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  
  // Mobile panel toggle state (sidebar, chat)
  const [mobilePanel, setMobilePanel] = useState('sidebar');

  const handleMarketPriceChange = (field, val) => {
    setMarketPriceRange(prev => ({ ...prev, [field]: val }));
  };

  // Reset states on activePage change to make it mobile friendly and fresh
  useEffect(() => {
    setMobilePanel('sidebar');
    setSelectedContactId(null);
  }, [activePage]);

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

        {/* Dynamic Center Sidebar Column (Pane 2) */}
        <div className={`sidebar ${mobilePanel === 'chat' ? 'mobile-hide' : ''}`} style={{ flex: '0 0 320px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {activePage === 'chats' && (
            <ChatList />
          )}
          {activePage === 'contacts' && (
            <ContactsSidebarList
              onSelectContact={(id) => {
                setSelectedContactId(id);
                setMobilePanel('chat');
              }}
            />
          )}
          {activePage === 'stories' && (
            <StoriesSidebarList
              activeUserIndex={activeStoryUserIndex}
              onSelectUserIndex={(index) => {
                setActiveStoryUserIndex(index);
                setMobilePanel('chat');
              }}
              onPostClick={() => setPostStoryModalOpen(true)}
            />
          )}
          {activePage === 'marketplace' && (
            <MarketplaceSidebarFilters
              category={marketCategory}
              onCategoryChange={setMarketCategory}
              searchQuery={marketSearch}
              onSearchChange={setMarketSearch}
              priceRange={marketPriceRange}
              onPriceChange={handleMarketPriceChange}
              onSellClick={() => setSellItemModalOpen(true)}
            />
          )}
          {activePage === 'security' && (
            <SecuritySidebarMenu
              activeSection={settingsSection}
              onSectionChange={(sec) => {
                setSettingsSection(sec);
                setMobilePanel('chat');
              }}
            />
          )}
          {activePage === 'admin' && (
            <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Analytics</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Administration console is active. View stats on the right workspace.</p>
            </div>
          )}
        </div>

        {/* Dynamic Right Main Workspace (Pane 3) */}
        <div className={`chat-window ${mobilePanel === 'chat' || activePage !== 'chats' ? 'active' : ''}`} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activePage === 'chats' && (
            <ChatWindow
              className="active"
              onBack={() => setMobilePanel('sidebar')}
            />
          )}
          {activePage === 'contacts' && (
            <ContactsPage
              selectedContactId={selectedContactId}
              onClearSelection={() => {
                setSelectedContactId(null);
                setMobilePanel('sidebar');
              }}
            />
          )}
          {activePage === 'stories' && (
            <StoriesPage
              activeUserIndex={activeStoryUserIndex}
              setActiveUserIndex={setActiveStoryUserIndex}
              postStoryModalOpen={postStoryModalOpen}
              setPostStoryModalOpen={setPostStoryModalOpen}
              onBack={() => setMobilePanel('sidebar')}
            />
          )}
          {activePage === 'marketplace' && (
            <MarketplacePage
              category={marketCategory}
              searchQuery={marketSearch}
              priceRange={marketPriceRange}
              sellItemModalOpen={sellItemModalOpen}
              setSellItemModalOpen={setSellItemModalOpen}
              onBack={() => setMobilePanel('sidebar')}
            />
          )}
          {activePage === 'security' && (
            <SecurityPage
              activeSection={settingsSection}
              onBack={() => setMobilePanel('sidebar')}
            />
          )}
          {activePage === 'admin' && (
            <AdminPage />
          )}
        </div>

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
