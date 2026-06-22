import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Search, Image as ImageIcon, Link as LinkIcon, FileText, Bell, PenTool, Smile } from 'lucide-react';
import { api } from '../../services/api';

const InfoPanel = ({ onClose, onSearch }) => {
  const { selectedChat, messages } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();

  const getChatDetails = () => {
    if (!selectedChat) return { name: '', avatar: '' };
    if (selectedChat.isGroup) {
      return {
        name: selectedChat.groupName,
        avatar: selectedChat.groupAvatar || `https://ui-avatars.com/api/?background=4F46E5&color=fff&name=${encodeURIComponent(selectedChat.groupName)}`,
      };
    }
    const partner = selectedChat.participants.find((p) => p._id !== user?._id);
    return {
      name: partner?.fullName || 'User',
      avatar: partner?.avatar || `https://ui-avatars.com/api/?background=6366F1&color=fff&name=${encodeURIComponent(partner?.fullName || 'U')}`
    };
  };

  const details = getChatDetails();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const getMediaAttachments = () => {
    return messages
      .flatMap(m => m.attachments || [])
      .filter(a => a.type === 'image' || a.type === 'video');
  };

  const getFileAttachments = () => {
    return messages
      .flatMap(m => m.attachments || [])
      .filter(a => a.type === 'file');
  };

  return (
    <div className="info-panel-container clay-card" style={{
      width: '320px',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.85)',
      borderLeft: '1.5px solid rgba(226, 232, 240, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Chat Info</h3>
        <button onClick={onClose} className="chat-window-opt-btn" style={{ width: '32px', height: '32px' }}>
          <X size={18} />
        </button>
      </div>

      {/* Avatar & Name */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <img
          src={details.avatar}
          alt="Chat Avatar"
          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }}
        />
        <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>{details.name}</h4>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <div style={{ background: 'var(--clay-primary-light)', padding: '10px', borderRadius: '50%', color: 'var(--clay-primary)' }}><Search size={18}/></div>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Search</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <div style={{ background: 'var(--clay-primary-light)', padding: '10px', borderRadius: '50%', color: 'var(--clay-primary)' }}><Bell size={18}/></div>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Mute</span>
        </div>
      </div>

      {/* Search in Chat */}
      <div style={{ padding: '20px' }}>
        <h5 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 'bold', marginBottom: '12px' }}>Search in Chat</h5>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: 'rgba(226, 232, 240, 0.5)', borderRadius: '12px', padding: '4px 12px' }}>
          <Search size={16} color="var(--text-light)" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '8px', fontSize: '13px', width: '100%', outline: 'none' }}
          />
        </form>
      </div>

      {/* Customization */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <h5 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 'bold', marginBottom: '12px' }}>Customize Chat</h5>
        <div
          onClick={async () => {
             const newName = window.prompt("Enter new nickname for this chat:");
             if (newName) {
                try {
                  const payload = selectedChat.isGroup
                    ? { groupName: newName }
                    : { nicknames: [{ user: selectedChat.participants.find(p => p._id !== user._id)._id, nickname: newName }] };
                  await api.put(`/chats/${selectedChat._id}`, payload);
                } catch(e){
                  console.error('Failed to update chat info', e);
                }
             }
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PenTool size={18} color="var(--clay-primary)" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Edit Nicknames/Name</span>
          </div>
        </div>

        <div
          onClick={async () => {
             const newReaction = window.prompt("Enter a new emoji for Quick Reaction (e.g. ❤️):");
             if (newReaction) {
                try {
                  await api.put('/auth/profile', { quickReaction: newReaction });
                  alert("Quick reaction updated successfully!");
                } catch(e) {
                  console.error('Failed to update quick reaction', e);
                }
             }
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Smile size={18} color="var(--clay-primary)" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Change Quick Reaction</span>
          </div>
          <span style={{ fontSize: '14px' }}>{user?.quickReaction || '👍'}</span>
        </div>
      </div>

      {/* Media Gallery Preview */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <h5 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={16} /> Shared Media
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {getMediaAttachments().slice(0, 6).map((media, idx) => {
            if (media.type === 'video') {
               return (
                  <div key={idx} style={{ position: 'relative', width: '100%', height: '70px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '10px' }}>▶</div>
                  </div>
               );
            }
            return <img key={idx} src={media.url} alt="media" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />;
          })}
        </div>
      </div>

      {/* Files */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
        <h5 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Shared Files
        </h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {getFileAttachments().slice(0, 3).map((file, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'rgba(226, 232, 240, 0.4)', borderRadius: '8px' }}>
              <div style={{ background: 'var(--clay-primary)', padding: '6px', borderRadius: '6px', color: 'white' }}><FileText size={14}/></div>
              <span style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.filename}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
