import React from 'react';

// Single Chat Message Pulse Item
export const MessageSkeletonItem = ({ isSender = false }) => {
  return (
    <div
      className={`skeleton-bubble skeleton-pulse ${isSender ? 'sender' : 'receiver'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        borderBottomRightRadius: isSender ? '4px' : '16px',
        borderBottomLeftRadius: isSender ? '16px' : '4px',
        border: '1px solid rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="skeleton-name skeleton-pulse" style={{ width: isSender ? '50px' : '90px', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div className="skeleton-text skeleton-pulse" style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '3px' }}></div>
    </div>
  );
};

// Full Chat Feed Loader Layout
export const ChatFeedSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '24px', gap: '16px', overflow: 'hidden' }}>
      <MessageSkeletonItem isSender={false} />
      <MessageSkeletonItem isSender={true} />
      <MessageSkeletonItem isSender={false} />
      <MessageSkeletonItem isSender={false} />
      <MessageSkeletonItem isSender={true} />
      <MessageSkeletonItem isSender={false} />
    </div>
  );
};

// Single Contact Card item
export const ContactSkeletonItem = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)' }}>
      <div className="skeleton-avatar skeleton-pulse" style={{ width: '40px', height: '40px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '50%' }}></div>
      <div style={{ flex: 1 }}>
        <div className="skeleton-name skeleton-pulse" style={{ width: '110px', height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '6px' }}></div>
        <div className="skeleton-text skeleton-pulse" style={{ width: '180px', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px' }}></div>
      </div>
    </div>
  );
};

// Full Contacts List Loader Layout
export const ContactListSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <ContactSkeletonItem />
      <ContactSkeletonItem />
      <ContactSkeletonItem />
      <ContactSkeletonItem />
    </div>
  );
};
