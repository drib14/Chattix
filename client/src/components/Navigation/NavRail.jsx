import React, { useContext } from 'react';
import { MessageSquare, User, ArrowRightLeft, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Logo from '../UI/Logo';

const NavRail = () => {
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
          <button className="nav-icon active" title="Chats">
            <MessageSquare size={24} />
          </button>
          <button className="nav-icon" title="People">
            <User size={24} />
          </button>
        </div>
      </div>
      <div className="nav-rail-bottom">
        <button className="nav-icon" onClick={handleSwitchAccount} title="Switch Profile">
          <ArrowRightLeft size={22} />
        </button>
        <button className="nav-icon" onClick={logout} title="Sign Out">
          <LogOut size={22} />
        </button>
        <div className="nav-avatar">
          {currentUser && (
            <div className="user-avatar font-bold" style={{ width: '40px', height: '40px' }}>
              {currentUser.firstName?.[0] || ''}{currentUser.lastName?.[0] || ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavRail;
