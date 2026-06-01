import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Plus, Play } from 'lucide-react';

export default function StoriesSidebarList({ onSelectUserIndex, activeUserIndex, onPostClick }) {
  const { getStories, user } = useApp();
  const [storiesList, setStoriesList] = useState([]);

  // Fetch and combine stories
  const loadStories = async () => {
    try {
      const dbStories = await getStories();
      const mockStories = [
        {
          _id: 'mock_1',
          username: 'alice_adventurer',
          profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
          stories: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
              text: 'Road trip across Utah! 🏔️✨',
              createdAt: new Date(Date.now() - 3600000 * 2)
            }
          ]
        },
        {
          _id: 'mock_2',
          username: 'designer_bob',
          profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          stories: [
            {
              imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
              text: 'Scaffolding visual wireframes in Figma 💻📐',
              createdAt: new Date(Date.now() - 3600000 * 4)
            }
          ]
        }
      ];

      const combined = [...dbStories];
      mockStories.forEach(mock => {
        if (!combined.some(item => item.username === mock.username)) {
          combined.push(mock);
        }
      });
      setStoriesList(combined);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStories();
    // Refresh listener for newly posted stories
    const refreshStories = () => loadStories();
    window.addEventListener('refresh_stories_feed', refreshStories);
    return () => window.removeEventListener('refresh_stories_feed', refreshStories);
  }, []);

  return (
    <div className="sidebar glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.2s ease-out' }}>
      
      {/* Header */}
      <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BookOpen size={20} className="text-purple-glowing" style={{ color: 'var(--accent-purple)' }} />
          Stories
        </h2>
        
        <button
          className="icon-btn"
          onClick={onPostClick}
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            color: 'var(--accent-purple)',
            width: '28px',
            height: '28px',
            borderRadius: '50%'
          }}
          title="Post new story"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Quick Creator card in sidebar */}
      <div style={{ padding: '12px' }}>
        <div
          onClick={onPostClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed var(--glass-border)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)',
            flexShrink: 0
          }}>
            <Plus size={18} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'white' }}>Create your Story</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Share a photo and caption</div>
          </div>
        </div>
      </div>

      {/* Stories list scroll */}
      <div className="sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px 8px 8px' }}>
          RECENT UPDATES
        </div>

        {storiesList.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No recent updates.
          </div>
        ) : (
          storiesList.map((storyItem, idx) => {
            const isSelected = activeUserIndex === idx;
            const hasMultiple = storyItem.stories.length > 1;

            return (
              <div
                key={storyItem._id || idx}
                onClick={() => onSelectUserIndex(idx)}
                className={`list-item ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                {/* Visual Circle Frame */}
                <div style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  padding: '2px',
                  border: isSelected ? '2px solid var(--accent-purple)' : '2.5px solid var(--accent-purple)',
                  boxShadow: isSelected ? '0 0 12px var(--accent-purple-glow)' : 'none',
                  flexShrink: 0,
                  background: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {storyItem.profilePhoto ? (
                    <img src={storyItem.profilePhoto} alt={storyItem.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#3b0764', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                      {storyItem.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {hasMultiple && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--accent-purple)', color: 'white', fontSize: '8px', fontWeight: 'bold', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {storyItem.stories.length}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: isSelected ? 'var(--accent-purple)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storyItem.username === user.username ? 'My Story' : `@${storyItem.username}`}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {storyItem.stories[0]?.text || 'No caption'}
                  </div>
                </div>

                <div style={{ color: 'var(--accent-purple)', opacity: 0.8 }}>
                  <Play size={11} fill="currentColor" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
