import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, BookOpen } from 'lucide-react';

export default function StoriesPage({ activeUserIndex, setActiveUserIndex, postStoryModalOpen, setPostStoryModalOpen }) {
  const { user, createStory, getStories, showToast } = useApp();
  const [storiesFeed, setStoriesFeed] = useState([]);
  const [localShowCreateModal, setLocalShowCreateModal] = useState(false);
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [newStoryText, setNewStoryText] = useState('');
  
  // Backwards compatibility for internal modal states
  const showCreateModal = postStoryModalOpen !== undefined ? postStoryModalOpen : localShowCreateModal;
  const setShowCreateModal = setPostStoryModalOpen || setLocalShowCreateModal;

  // Fullscreen Viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState(0); // Index in that user's stories array
  const [storyTimer, setStoryTimer] = useState(0);

  // Load stories feed from MERN database + combine default mock stories
  const loadStoriesFeed = async () => {
    const list = await getStories();
    
    // Curated high-res default mockup stories
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
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
            text: 'Sandy beaches and crystal blue waves 🌊🌴',
            createdAt: new Date(Date.now() - 3600000 * 1)
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
      },
      {
        _id: 'mock_3',
        username: 'chef_clara',
        profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
        stories: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
            text: 'Fresh handmade gourmet pizza! 🍕🔥',
            createdAt: new Date(Date.now() - 3600000 * 3)
          }
        ]
      }
    ];

    // Merge database list with mockups (filtering duplicates if database contains mock IDs)
    const combined = [...list];
    mockStories.forEach(mock => {
      if (!combined.some(item => item.username === mock.username)) {
        combined.push(mock);
      }
    });
    
    setStoriesFeed(combined);
  };

  useEffect(() => {
    loadStoriesFeed();
  }, []);

  // Story autoplay interval timer (5 seconds per slide)
  useEffect(() => {
    let interval;
    if (activeUserIndex !== null && storiesFeed[activeUserIndex]) {
      setStoryTimer(0);
      interval = setInterval(() => {
        setStoryTimer((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + 2; // Increment progress bar
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeUserIndex, activeStoryIndex, storiesFeed]);

  const handleNextStory = () => {
    if (activeUserIndex === null || !storiesFeed[activeUserIndex]) return;
    const userStories = storiesFeed[activeUserIndex].stories;
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      // Transition to next user's deck if available
      if (activeUserIndex < storiesFeed.length - 1) {
        setActiveUserIndex(prev => prev + 1);
        setActiveStoryIndex(0);
      } else {
        // End of all stories
        setActiveUserIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeUserIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      // Transition to previous user's deck if available
      if (activeUserIndex > 0) {
        setActiveUserIndex(prev => prev - 1);
        const prevUserStoriesCount = storiesFeed[activeUserIndex - 1].stories.length;
        setActiveStoryIndex(prevUserStoriesCount - 1);
      } else {
        // Loop back or reset
        setStoryTimer(0);
      }
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newStoryUrl) return;
    
    const updatedStories = await createStory(newStoryUrl, newStoryText);
    if (updatedStories) {
      setNewStoryUrl('');
      setNewStoryText('');
      setShowCreateModal(false);
      loadStoriesFeed();
      // Notify sidebar lists to refresh
      window.dispatchEvent(new Event('refresh_stories_feed'));
    }
  };

  // Reset active story index when selected user index pivots
  useEffect(() => {
    setActiveStoryIndex(0);
    setStoryTimer(0);
  }, [activeUserIndex]);

  const activeUser = activeUserIndex !== null && storiesFeed[activeUserIndex] ? storiesFeed[activeUserIndex] : null;
  const activeStory = activeUser ? activeUser.stories[activeStoryIndex] : null;

  return (
    <div className="stories-page-container" style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '30px',
      background: 'radial-gradient(circle at 50% 10%, rgba(168,85,247,0.05) 0%, transparent 50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* 1. EMBEDDED STORIES VIEW */}
      {activeUser && activeStory ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
          
          {/* Main Viewer Card */}
          <div style={{
            width: '100%',
            maxWidth: '380px',
            height: '100%',
            maxHeight: '600px',
            minHeight: '480px',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.9) 100%), url(${activeStory.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            animation: 'scaleUp 0.3s ease-out'
          }}>
            
            {/* Top progress indicators block */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px' }}>
              {activeUser.stories.map((s, idx) => {
                let fillVal = 0;
                if (idx < activeStoryIndex) fillVal = 100;
                if (idx === activeStoryIndex) fillVal = storyTimer;
                return (
                  <div key={idx} style={{ flex: 1, height: '3.5px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${fillVal}%`, height: '100%', background: 'white', transition: 'width 0.1s linear' }}></div>
                  </div>
                );
              })}
            </div>

            {/* Viewer Header Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden' }}>
                  {activeUser.profilePhoto ? (
                    <img src={activeUser.profilePhoto} alt={activeUser.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', background: '#3b0764' }}>
                      {activeUser.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.6)', margin: 0 }}>
                    {activeUser.username}
                  </h3>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                    {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Close spectator screen */}
              <button
                onClick={() => setActiveUserIndex(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Navigation click shields (Left and Right overlays) */}
            <div style={{ position: 'absolute', top: '100px', bottom: '120px', left: 0, right: 0, display: 'flex' }}>
              <div onClick={handlePrevStory} style={{ flex: 1, cursor: 'w-resize' }}></div>
              <div onClick={handleNextStory} style={{ flex: 1, cursor: 'e-resize' }}></div>
            </div>

            {/* Bottom Caption slot */}
            <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center', paddingBottom: '16px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                lineHeight: '1.4',
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                maxWidth: '90%',
                margin: 0
              }}>
                {activeStory.text || 'No caption 📸'}
              </p>
            </div>
            
          </div>
        </div>
      ) : (
        /* 2. SPLASH PANE (DEFAULT WHEN NO STORY IS ACTIVE) */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
            <BookOpen size={36} />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Stories Deck Spectator</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '340px', lineHeight: '1.5' }}>
              Select a friend's active story in the left sidebar to watch their daily moments, or post your own status photo!
            </p>
          </div>
          
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 20px' }}
          >
            <Plus size={14} /> Create a Story
          </button>
        </div>
      )}

      {/* CREATE STORY CARD MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Publish Story</h2>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Story Image URL</label>
                  <input
                    className="glass-input"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newStoryUrl}
                    onChange={(e) => setNewStoryUrl(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label>Story Caption Text</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Describe your moment... ✨✍️"
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={!newStoryUrl}>Publish Story</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
