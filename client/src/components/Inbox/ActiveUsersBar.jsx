import React, { useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';

const ActiveUsersBar = ({ allUsers, onSelectChat }) => {
  const { onlineUserIds } = useContext(SocketContext);

  const calculateTimeStr = (user) => {
    const isOnline = onlineUserIds.includes(user._id);
    if (isOnline) return 'Online';
    if (!user.lastActive) return '';
    
    const diffMins = Math.floor((Date.now() - new Date(user.lastActive).getTime()) / 60000);
    if (diffMins < 1) return '<1m';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h`;
    return `${Math.floor(diffMins/1440)}d`;
  };

  const sortedUsers = [...allUsers]
    .filter(u => onlineUserIds.includes(u._id) || u.lastActive)
    .sort((a, b) => {
      const aTime = onlineUserIds.includes(a._id) ? Infinity : new Date(a.lastActive).getTime();
      const bTime = onlineUserIds.includes(b._id) ? Infinity : new Date(b.lastActive).getTime();
      return bTime - aTime;
    });

  if (sortedUsers.length === 0) return null;

  return (
    <div className="active-users-bar">
      <div className="active-users-scroll">
        {sortedUsers.map(user => {
          const isOnline = onlineUserIds.includes(user._id);
          return (
            <div key={user._id} className="active-user-item" onClick={() => onSelectChat(user)}>
               <div className={`active-avatar-ring ${isOnline ? 'online' : ''}`}>
                 <div className="user-avatar">
                   {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                 </div>
               </div>
               <span className="active-user-name">
                 {user.firstName}
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveUsersBar;
