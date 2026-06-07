import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import Avatar from '../UI/Avatar';

const PeoplePane = ({ allUsers, onSelectChat }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = allUsers.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="inbox-pane">
      <div className="inbox-header">
        <h2>People</h2>
      </div>

      <div className="inbox-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="inbox-list">
        <div className="inbox-section">
          <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
            All Users on Chattix
          </div>
          {filteredUsers.map((user) => (
            <div 
              key={user._id} 
              className="inbox-item"
              onClick={() => onSelectChat(user)}
            >
              <Avatar user={user} size={48} />
              <div className="inbox-item-info">
                <span className="inbox-item-name">{user.firstName} {user.lastName}</span>
                <span className="inbox-item-sub">@{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeoplePane;
