import React, { useState } from 'react';
import { Smile } from 'lucide-react';

const EMOJIS = ['😀','😂','🥰','😎','😭','😡','👍','❤️','🔥','🎉','✨','🙌','🤔','👀','💯'];

const EmojiPicker = ({ onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="chat-window-opt-btn"
        title="Emoji"
      >
        <Smile size={18} />
      </button>

      {isOpen && (
        <div className="clay-card" style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: '10px',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          zIndex: 100,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onEmojiSelect(emoji);
                setIsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
