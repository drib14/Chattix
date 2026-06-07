import React from 'react';

const Avatar = ({ user, size = 40, className = '' }) => {
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const hasPic = !!user.profilePic;

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: hasPic ? 'transparent' : '#222',
    color: 'white',
    fontSize: `${size * 0.4}px`,
    fontWeight: 600,
    overflow: 'hidden',
    border: hasPic ? 'none' : '1px solid var(--border-color)',
  };

  return (
    <div className={`avatar-wrapper ${className}`} style={style} title={`${user.firstName} ${user.lastName}`}>
      {hasPic ? (
        <img 
          src={user.profilePic} 
          alt={`${user.firstName}'s avatar`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.parentElement.style.background = '#222';
            e.target.parentElement.style.border = '1px solid var(--border-color)';
            e.target.parentElement.innerHTML = initials;
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;
