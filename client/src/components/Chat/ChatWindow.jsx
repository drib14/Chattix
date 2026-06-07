import React, { useContext, useEffect, useRef, useState } from 'react';
import { Phone, Video, Info, Send } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../api/axios';
import Logo from '../UI/Logo';
import Avatar from '../UI/Avatar';

const ChatWindow = ({ activeChat, conversations, setConversations, allUsers }) => {
  const { currentUser } = useContext(AuthContext);
  const { onlineUserIds, typingUsers, emitTyping, emitStopTyping, emitMessage, socket } = useContext(SocketContext);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load message history from DB when activeChat changes
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
              return { ...c, messages: formattedMessages };
            }
            return c;
          });

          if (!updated.some(c => c.recipient._id === activeChat._id)) {
            updated.push({ recipient: activeChat, messages: formattedMessages });
          }

          localStorage.setItem(`chattix_chats_${currentUser.id || currentUser._id}`, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error('Error fetching chat history', error);
      }
    };

    fetchMessages();
  }, [activeChat, currentUser, setConversations]);

  // Handle incoming socket messages globally
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleReceiveMessage = (message) => {
      const formattedMessage = {
        id: message._id,
        senderId: message.senderId,
        text: message.text,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) => {
        let updated = [...prev];
        const existingIdx = updated.findIndex(c => c.recipient._id === message.senderId);
        
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            messages: [...updated[existingIdx].messages, formattedMessage]
          };
        } else {
          const sender = allUsers.find(u => u._id === message.senderId);
          if (sender) {
            updated.push({ recipient: sender, messages: [formattedMessage] });
          }
        }
        localStorage.setItem(`chattix_chats_${currentUser.id || currentUser._id}`, JSON.stringify(updated));
        return updated;
      });
    };

    // Need to avoid duplicate listeners
    socket.off('receive_message').on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message');
    };
  }, [socket, currentUser, allUsers, setConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat, conversations, typingUsers]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const currentText = messageText;
    setMessageText('');
    emitStopTyping(activeChat._id);

    try {
      const response = await api.post('/messages', {
        recipientId: activeChat._id,
        text: currentText
      });

      const dbMessage = response.data;
      emitMessage(activeChat._id, dbMessage);

      const newMessage = {
        id: dbMessage._id,
        senderId: currentUser.id || currentUser._id,
        text: dbMessage.text,
        timestamp: new Date(dbMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.recipient._id === activeChat._id) {
            return { ...c, messages: [...c.messages, newMessage] };
          }
          return c;
        });
        localStorage.setItem(`chattix_chats_${currentUser.id || currentUser._id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error sending message to DB', error);
      setMessageText(currentText);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (activeChat) {
      emitTyping(activeChat._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeChat._id);
      }, 2000);
    }
  };

  const getActiveChatMessages = () => {
    if (!activeChat) return [];
    const chat = conversations.find(c => c.recipient._id === activeChat._id);
    return chat ? chat.messages : [];
  };

  if (!activeChat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <Logo size={80} fill="var(--text-secondary)" />
          <h2>Welcome to Messenger</h2>
          <p>Select a chat to start messaging.</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUserIds.includes(activeChat._id);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-profile">
          <div className={`active-avatar-ring ${isOnline ? 'online' : ''}`}>
            <Avatar user={activeChat} size={40} />
          </div>
          <div className="chat-header-details">
            <h3>{activeChat.firstName} {activeChat.lastName}</h3>
            <span className="status-text">{isOnline ? 'Active now' : 'Offline'}</span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-action-btn"><Phone size={20} /></button>
          <button className="icon-action-btn"><Video size={20} /></button>
          <button className="icon-action-btn"><Info size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {getActiveChatMessages().map((msg, index, arr) => {
          const isOwn = msg.senderId === (currentUser.id || currentUser._id);
          const senderUser = isOwn ? currentUser : activeChat;
          const isNextSame = index < arr.length - 1 && arr[index+1].senderId === msg.senderId;
          const isPrevSame = index > 0 && arr[index-1].senderId === msg.senderId;
          
          return (
            <div 
              key={msg.id} 
              className={`message-row ${isOwn ? 'own' : 'incoming'}`}
              style={{ marginBottom: isNextSame ? '2px' : '1rem' }}
            >
              {!isOwn && (
                <div style={{ opacity: isNextSame ? 0 : 1 }}>
                  <Avatar user={senderUser} size={28} />
                </div>
              )}
              <div 
                className="message-bubble" 
                style={{ 
                  borderBottomRightRadius: isOwn && !isNextSame ? '0.25rem' : '1.5rem', 
                  borderTopRightRadius: isOwn && isPrevSame ? '0.25rem' : '1.5rem',
                  borderBottomLeftRadius: !isOwn && !isNextSame ? '0.25rem' : '1.5rem',
                  borderTopLeftRadius: !isOwn && isPrevSame ? '0.25rem' : '1.5rem',
                }}
              >
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}

        {typingUsers.has(activeChat._id) && (
          <div className="message-row incoming" style={{ marginBottom: '1rem' }}>
            <Avatar user={activeChat} size={28} />
            <div className="message-bubble typing-bubble">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="input-pill">
            <input
              type="text"
              placeholder="Aa"
              value={messageText}
              onChange={handleTyping}
              required
            />
            <button type="submit" className="send-btn">
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
