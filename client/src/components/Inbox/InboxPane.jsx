import React, { useState } from 'react';
import { Search, X, Settings } from 'lucide-react';
import ActiveUsersBar from './ActiveUsersBar';

const InboxPane = ({ allUsers, conversations, activeChat, onSelectChat }) => {
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
        <h2>Chats</h2>
        <button className="icon-action-btn" title="Settings">
          <Settings size={20} />
        </button>
      </div>

      <div className="inbox-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search Messenger"
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

      {!searchQuery && <ActiveUsersBar allUsers={allUsers} onSelectChat={onSelectChat} />}

      <div className="inbox-list">
        {searchQuery ? (
          <div className="inbox-section">
            {filteredUsers.map((user) => (
              <div 
                key={user._id} 
                className="inbox-item"
                onClick={() => {
                  onSelectChat(user);
                  setSearchQuery('');
                }}
              >
                <div className="user-avatar">
                  {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                </div>
                <div className="inbox-item-info">
                  <span className="inbox-item-name">{user.firstName} {user.lastName}</span>
                  <span className="inbox-item-sub">@{user.username}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="inbox-section">
            {conversations.map((chat) => {
              const isSelected = activeChat && activeChat._id === chat.recipient._id;
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <div 
                  key={chat.recipient._id} 
                  className={`inbox-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectChat(chat.recipient)}
                >
                  <div className="user-avatar font-bold">
                    {chat.recipient?.firstName?.[0] || ''}{chat.recipient?.lastName?.[0] || ''}
                  </div>
                  <div className="inbox-item-info">
                    <span className="inbox-item-name">{chat.recipient.firstName} {chat.recipient.lastName}</span>
                    <span className="inbox-item-sub">
                      {lastMsg ? lastMsg.text : 'Start chatting'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPane;
