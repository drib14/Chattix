import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChattixLogo from './ChattixLogo';
import MobileHamburgerMenu from './MobileHamburgerMenu';

const MobileHeader = ({ activeTab, setActiveTab, onMenuOpen }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = () => {
    setShowMenu(true);
    onMenuOpen?.();
  };

  const tabs = [
    { id: 'chats', label: 'Chats' },
    { id: 'friends', label: 'People' },
    { id: 'groups', label: 'Groups' },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex flex-col border-b border-gray-200 bg-white safe-top">
        {/* Row 1: Logo + Hamburger Menu */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Left: CHATTIX Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <ChattixLogo size="sm" showText={true} className="shrink-0" />
          </div>

          {/* Right: Hamburger Menu */}
          <button
            type="button"
            onClick={handleMenuOpen}
            className="p-2 -mr-2 rounded-xl hover:bg-gray-100 text-gray-700 shrink-0 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Row 2: Search Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, groups or chats..."
              className="w-full pl-11 pr-9 py-2.5 bg-chattix-bg border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30 focus:border-chattix-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Tabs */}
        <div className="flex items-center border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-chattix-primary border-chattix-primary'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hamburger Menu Drawer */}
      <MobileHamburgerMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

export default MobileHeader;
