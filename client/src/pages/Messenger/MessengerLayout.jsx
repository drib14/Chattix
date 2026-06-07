import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import NavRail from '../../components/Navigation/NavRail';
import InboxPane from '../../components/Inbox/InboxPane';
import PeoplePane from '../../components/Inbox/PeoplePane';
import SettingsPane from '../../components/Settings/SettingsPane';
import ChatWindow from '../../components/Chat/ChatWindow';
import api from '../../api/axios';

const MessengerLayout = () => {
  const { currentUser } = useContext(AuthContext);
  const [activePane, setActivePane] = useState('chats'); // 'chats', 'people', 'settings'
  const [activeChat, setActiveChat] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Load initial users
    api.get('/users')
      .then((res) => {
        const others = res.data.filter((u) => u._id !== (currentUser.id || currentUser._id));
        setAllUsers(others);
      })
      .catch((err) => console.error('Error fetching users', err));

    // Load local history metadata
    const localChats = localStorage.getItem(`chattix_chats_${currentUser.id || currentUser._id}`);
    if (localChats) {
      setConversations(JSON.parse(localChats));
    }
  }, [currentUser]);

  const handleSelectChat = (user) => {
    setActiveChat(user);
  };

  return (
    <div className="messenger-layout">
      <NavRail activePane={activePane} setActivePane={setActivePane} />
      
      {activePane === 'chats' && (
        <InboxPane 
          allUsers={allUsers} 
          conversations={conversations} 
          activeChat={activeChat} 
          onSelectChat={handleSelectChat} 
        />
      )}
      
      {activePane === 'people' && (
        <PeoplePane 
          allUsers={allUsers} 
          onSelectChat={(user) => {
            handleSelectChat(user);
            setActivePane('chats');
          }} 
        />
      )}
      
      {activePane === 'settings' && (
        <SettingsPane />
      )}

      <ChatWindow 
        activeChat={activeChat} 
        conversations={conversations} 
        setConversations={setConversations} 
        allUsers={allUsers}
      />
    </div>
  );
};

export default MessengerLayout;
