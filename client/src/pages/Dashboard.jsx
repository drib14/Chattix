import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Send, MessageSquare, ArrowRightLeft, ShieldCheck, KeyRound, X, Check, Clock } from 'lucide-react';
import api from '../api/axios';

const Logo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="chattix-logo-svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="128" fill="url(#logoGrad)" />
    <path d="M220,180 C150,180 100,215 100,270 C100,325 150,360 220,360 C235,360 260,355 275,350 L330,375 L320,335 C335,320 340,295 340,270 C340,215 290,180 220,180 Z" fill="#1e293b" opacity="0.9" />
    <path d="M292,130 C222,130 172,165 172,220 C172,245 177,270 192,285 L182,325 L237,300 C252,305 277,310 292,310 C362,310 412,275 412,220 C412,165 362,130 292,130 Z" fill="#ffffff" />
    <circle cx="252" cy="220" r="10" fill="url(#logoGrad)" />
    <circle cx="292" cy="220" r="10" fill="url(#logoGrad)" />
    <circle cx="332" cy="220" r="10" fill="url(#logoGrad)" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  // Banner state
  const [showSaveBanner, setShowSaveBanner] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const messagesEndRef = useRef(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(user);
    setCurrentUser(parsedUser);

    // Check if the user is already saved in quick profiles
    const saved = localStorage.getItem('chattix_saved_accounts');
    const savedList = saved ? JSON.parse(saved).filter(acc => acc && acc.user) : [];
    const currentId = parsedUser.id || parsedUser._id;
    const isSaved = savedList.some((acc) => (acc.user.id || acc.user._id) === currentId);

    // If not saved and not logged via quick switcher, show the banner
    const loggedViaQuick = localStorage.getItem('chattix_logged_via_quick_login') === 'true';
    if (!isSaved && !loggedViaQuick) {
      setShowSaveBanner(true);
    }

    // Fetch all users to start chat
    api.get('/users')
      .then((res) => {
        // Filter out current user from directory
        setAllUsers(res.data.filter((u) => u._id !== parsedUser.id));
      })
      .catch((err) => console.error('Error fetching users', err));

    // Load active conversation recipient metadata from localStorage
    const localChats = localStorage.getItem(`chattix_chats_${parsedUser.id}`);
    if (localChats) {
      setConversations(JSON.parse(localChats));
    }
  }, [navigate]);

  // Load message history from DB when activeChat changes, and set up polling
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${activeChat._id}`);
        
        setConversations((prevConversations) => {
          const formattedMessages = response.data.map(msg => ({
            id: msg._id,
            senderId: msg.senderId,
            text: msg.text,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          const updated = prevConversations.map((c) => {
            if (c.recipient._id === activeChat._id) {
              return {
                ...c,
                messages: formattedMessages
              };
            }
            return c;
          });

          // If conversation for activeChat is not in the list, create it
          if (!updated.some(c => c.recipient._id === activeChat._id)) {
            updated.push({
              recipient: activeChat,
              messages: formattedMessages
            });
          }

          localStorage.setItem(`chattix_chats_${currentUser.id}`, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error('Error fetching chat history', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [activeChat, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat, conversations]);

  const handleSaveAccount = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const saved = localStorage.getItem('chattix_saved_accounts');
    const savedList = saved ? JSON.parse(saved).filter(acc => acc && acc.user) : [];

    const currentId = currentUser.id || currentUser._id;
    // Avoid duplicates
    if (currentId && !savedList.some((acc) => (acc.user.id || acc.user._id) === currentId)) {
      savedList.push({
        token,
        user: JSON.parse(user)
      });
      localStorage.setItem('chattix_saved_accounts', JSON.stringify(savedList));
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setShowSaveBanner(false);
      setSaveSuccess(false);
    }, 2000);
  };

  const handleDismissBanner = () => {
    setShowSaveBanner(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chattix_logged_via_quick_login');
    navigate('/login');
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chattix_logged_via_quick_login');
    navigate('/login');
  };

  const handleSelectChat = (recipient) => {
    // Find if chat exists
    let existingChat = conversations.find(c => c.recipient._id === recipient._id);

    if (!existingChat) {
      existingChat = {
        recipient,
        messages: []
      };
      const updated = [...conversations, existingChat];
      setConversations(updated);
      localStorage.setItem(`chattix_chats_${currentUser.id}`, JSON.stringify(updated));
    }

    setActiveChat(recipient);
    setSearchQuery('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const currentText = messageText;
    setMessageText('');

    try {
      const response = await api.post('/messages', {
        recipientId: activeChat._id,
        text: currentText
      });

      const dbMessage = response.data;
      const newMessage = {
        id: dbMessage._id,
        senderId: currentUser.id,
        text: dbMessage.text,
        timestamp: new Date(dbMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.recipient._id === activeChat._id) {
            return {
              ...c,
              messages: [...c.messages, newMessage]
            };
          }
          return c;
        });
        localStorage.setItem(`chattix_chats_${currentUser.id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error sending message to DB', error);
      // Put message text back in input on failure
      setMessageText(currentText);
    }
  };

  const getActiveChatMessages = () => {
    if (!activeChat) return [];
    const chat = conversations.find(c => c.recipient._id === activeChat._id);
    return chat ? chat.messages : [];
  };

  // Filter directory users based on search query
  const filteredUsers = allUsers.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (!currentUser) return null;

  return (
    <div className="dashboard-wrapper">
      {/* Save Account Banner */}
      {showSaveBanner && (
        <div className="save-account-banner">
          <div className="banner-content">
            <div className="banner-icon-container">
              <KeyRound size={20} className="banner-icon" />
            </div>
            <div className="banner-text">
              <h4>Quick Switch Available</h4>
              <p>Save this account to securely switch profiles or login with a single click in this browser next time.</p>
            </div>
          </div>
          <div className="banner-actions">
            {saveSuccess ? (
              <button className="btn-banner-save success" disabled>
                <Check size={16} style={{ marginRight: '0.4rem' }} /> Saved
              </button>
            ) : (
              <button className="btn-banner-save" onClick={handleSaveAccount}>
                <ShieldCheck size={16} style={{ marginRight: '0.4rem' }} /> Save Profile
              </button>
            )}
            <button className="btn-banner-close" onClick={handleDismissBanner}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Logo size={28} />
              <span>Chattix</span>
            </div>
            
            <div className="sidebar-user">
              <div className="user-avatar">
                {currentUser?.firstName?.[0] || ''}{currentUser?.lastName?.[0] || ''}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser.firstName} {currentUser.lastName}</span>
                <span className="user-username">@{currentUser.username}</span>
              </div>
              <div className="user-actions">
                <button 
                  className="icon-action-btn" 
                  onClick={handleSwitchAccount} 
                  title="Switch Profile"
                >
                  <ArrowRightLeft size={18} />
                </button>
                <button 
                  className="icon-action-btn logout" 
                  onClick={handleLogout} 
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* User Directory Search */}
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search users to chat..."
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

          {/* Conversations or Search Results list */}
          <div className="sidebar-list">
            {searchQuery ? (
              <div className="search-results-section">
                <span className="list-section-title">Directory Results</span>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div 
                      key={user._id} 
                      className="conversation-item"
                      onClick={() => handleSelectChat(user)}
                    >
                      <div className="user-avatar search-avatar">
                        {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                      </div>
                      <div className="conversation-info">
                        <span className="conv-name">{user.firstName} {user.lastName}</span>
                        <span className="conv-sub text-muted">@{user.username}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="list-empty">
                    <User size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No users found matching query</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="active-chats-section">
                <span className="list-section-title">Conversations</span>
                {conversations.length > 0 ? (
                  conversations.map((chat) => {
                    const isSelected = activeChat && activeChat._id === chat.recipient._id;
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    return (
                      <div 
                        key={chat.recipient._id} 
                        className={`conversation-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectChat(chat.recipient)}
                      >
                        <div className="user-avatar font-bold">
                          {chat.recipient?.firstName?.[0] || ''}{chat.recipient?.lastName?.[0] || ''}
                        </div>
                        <div className="conversation-info">
                          <span className="conv-name">{chat.recipient.firstName} {chat.recipient.lastName}</span>
                          <span className="conv-sub text-slate-400">
                            {lastMsg ? lastMsg.text : 'Start chatting'}
                          </span>
                        </div>
                        {lastMsg && (
                          <div className="conv-time">
                            <Clock size={10} style={{ marginRight: '0.15rem', verticalAlign: 'middle' }} />
                            {lastMsg.timestamp}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="list-empty">
                    <MessageSquare size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>Use search above to start a conversation</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window Pane */}
        <div className="chat-window">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="chat-window-header">
                <div className="user-avatar font-bold">
                  {activeChat?.firstName?.[0] || ''}{activeChat?.lastName?.[0] || ''}
                </div>
                <div className="chat-header-details">
                  <h3>{activeChat.firstName} {activeChat.lastName}</h3>
                  <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span>Online</span>
                  </div>
                </div>
              </div>

              {/* Message History list */}
              <div className="chat-messages-container">
                {getActiveChatMessages().map((msg) => {
                  const isOwn = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`message-bubble-row ${isOwn ? 'own' : 'incoming'}`}
                    >
                      <div className="message-bubble">
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input form */}
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a secure message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="chat-text-input"
                  required
                />
                <button type="submit" className="btn-send-message" title="Send Message">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <Logo size={80} />
              <h2>Welcome to Chattix</h2>
              <p>Select an active profile or search in the directory to begin messaging securely.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
