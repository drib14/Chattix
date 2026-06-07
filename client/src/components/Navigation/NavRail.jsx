import React, { useContext } from 'react';
import { MessageSquare, User, ArrowRightLeft, LogOut, Settings } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../UI/Avatar';
import Logo from '../UI/Logo';

const NavRail = ({ activePane, setActivePane }) => {
  const { currentUser, logout } = useContext(AuthContext);

  const handleSwitchAccount = () => {
    logout();
  };

  return (
    <div className="nav-rail">
      <div className="nav-rail-top">
        <div className="nav-logo">
          <Logo size={32} />
        </div>
        <div className="nav-icons">
          <button 
            className={`nav-icon ${activePane === 'chats' ? 'active' : ''}`} 
            title="Chats"
            onClick={() => setActivePane('chats')}
          >
            <MessageSquare size={24} />
          </button>
          <button 
            className={`nav-icon ${activePane === 'people' ? 'active' : ''}`} 
            title="People"
            onClick={() => setActivePane('people')}
          >
            <User size={24} />
          </button>
        </div>
      </div>
      <div className="nav-rail-bottom">
        <button 
          className={`nav-icon ${activePane === 'settings' ? 'active' : ''}`} 
          title="Settings"
          onClick={() => setActivePane('settings')}
        >
          <Settings size={22} />
        </button>
        <button className="nav-icon" onClick={handleSwitchAccount} title="Switch Profile">
          <ArrowRightLeft size={22} />
        </button>
        <button className="nav-icon" onClick={logout} title="Sign Out">
          <LogOut size={22} />
        </button>
        <div className="nav-avatar" style={{ cursor: 'pointer', marginTop: '0.5rem' }} onClick={() => setActivePane('settings')} title={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}>
          <Avatar user={currentUser} size={40} />
        </div>
      </div>
    </div>
  );
};

export default NavRail;
