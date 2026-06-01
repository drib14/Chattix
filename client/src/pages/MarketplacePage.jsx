import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Send, Tag, MapPin, X, Plus } from 'lucide-react';

export default function MarketplacePage({
  category = 'All',
  searchQuery = '',
  priceRange = { min: '', max: '' },
  sellItemModalOpen = false,
  setSellItemModalOpen
}) {
  const { contacts, createChat, showToast, user } = useApp();
  
  // Custom listed items
  const [customListings, setCustomListings] = useState([]);
  
  // Create listing form states
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newLocation, setNewLocation] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Pre-populated high-end mockup items mapped to specific categories
  const marketplaceItems = [
    {
      id: 'item_1',
      title: 'iPhone 15 Pro Max - Slate Gray (256GB)',
      price: 999,
      location: 'Manila, PH',
      category: 'Electronics',
      description: 'Used for 2 months, 99% battery health. Comes with original box and accessories.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
      seller: contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2e8', username: 'chattix_seller_alpha' }
    },
    {
      id: 'item_2',
      title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
      price: 280,
      location: 'New York, US',
      category: 'Electronics',
      description: 'Mint condition, pristine sound. Only used once in transit.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
      seller: contacts[1] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2e9', username: 'chattix_seller_beta' }
    },
    {
      id: 'item_3',
      title: 'Tesla Model 3 Performance - Obsidian Black',
      price: 29999,
      location: 'Austin, TX',
      category: 'Vehicles',
      description: 'Full Self-Driving active. Immaculate battery health. Serious inquiries only.',
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=300&auto=format&fit=crop&q=80',
      seller: contacts[2] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2f0', username: 'chattix_seller_gamma' }
    },
    {
      id: 'item_4',
      title: 'Premium Cozy Loft - Skyline Glass Overlooks',
      price: 1400,
      location: 'Manhattan, NY',
      category: 'Rentals',
      description: 'Beautiful industrial studio, fully furnished, all utilities included. Available immediately.',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&auto=format&fit=crop&q=80',
      seller: contacts[3] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2f1', username: 'chattix_seller_delta' }
    },
    {
      id: 'item_5',
      title: 'Cyberpunk Hooded Jacket - Water Resistant',
      price: 95,
      location: 'Shibuya, JP',
      category: 'Apparel',
      description: 'Slate techwear windbreaker with matte black zippers. Fits size L.',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&auto=format&fit=crop&q=80',
      seller: contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2e8', username: 'chattix_seller_alpha' }
    }
  ];

  const handleMessageSeller = async (item) => {
    try {
      const sellerId = item.seller._id;
      if (sellerId.toString() === user.id.toString()) {
        showToast("You cannot purchase your own item!", "info");
        return;
      }

      showToast(`Initiating purchase discussion for ${item.title}...`, 'info');
      
      // 1. Create or open the 1-to-1 conversation with the seller
      const res = await createChat(false, [sellerId]);
      if (res && res.success) {
        const conversation = res.conversation;
        
        // 2. Pre-populate the quotation message inside the MERN room
        const quoteContent = `👋 Hi! I am interested in purchasing your item: "${item.title}" listed in the Chattix Marketplace for $${item.price}. Is this item still available?`;
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        await fetch(`${API_URL}/api/chats/${conversation._id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            content: quoteContent,
            messageType: 'text'
          })
        });

        // 3. Dispatch a custom window event to notify App.jsx to pivot navigation tab focus to chats page
        window.dispatchEvent(new CustomEvent('pivot_to_chats', { detail: { chatId: conversation._id } }));
        showToast('Chat opened and quote sent!', 'success');
      } else {
        showToast('Failed to start chat with seller.', 'error');
      }
    } catch(e) {
      console.error(e);
      showToast('Error messaging seller.', 'error');
    }
  };

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

    const newItemObj = {
      id: `custom_${Date.now()}`,
      title: newTitle,
      price: Number(newPrice),
      location: newLocation || 'Local Area',
      category: newCategory,
      description: newDesc || 'No description provided.',
      imageUrl: newUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300',
      seller: { _id: user.id, username: user.username }
    };

    setCustomListings(prev => [newItemObj, ...prev]);
    showToast('Listing posted successfully to Chattix!', 'success');
    
    // Clear forms
    setNewTitle('');
    setNewPrice('');
    setNewLocation('');
    setNewUrl('');
    setNewDesc('');
    
    if (setSellItemModalOpen) {
      setSellItemModalOpen(false);
    }
  };

  // Combine default mockup listings with custom ones
  const allListings = [...customListings, ...marketplaceItems];

  // Perform dynamic filtering based on sidebar prop parameters
  const filteredItems = allListings.filter(item => {
    // 1. Category check
    if (category && category !== 'All') {
      if (item.category.toLowerCase() !== category.toLowerCase()) return false;
    }

    // 2. Search text check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      if (!inTitle && !inDesc) return false;
    }

    // 3. Price filter check
    if (priceRange.min && item.price < Number(priceRange.min)) return false;
    if (priceRange.max && item.price > Number(priceRange.max)) return false;

    return true;
  });

  return (
    <div className="marketplace-page-container" style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '30px',
      background: 'radial-gradient(circle at 10% 20%, rgba(6,182,212,0.04) 0%, transparent 45%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', background: 'linear-gradient(135deg, white 40%, var(--accent-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Marketplace replica
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Explore local trade items. Category: <strong style={{ color: 'var(--accent-cyan)' }}>{category}</strong></p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', padding: '6px 12px', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: 'bold' }}>
          <ShoppingBag size={14} /> 2026 Trading Protocol Active
        </div>
      </div>

      {/* Items Cards Grid */}
      {filteredItems.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '10px' }}>
          <ShoppingBag size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No items found matching the active filters.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-secondary)',
                transition: 'transform 0.2s',
                animation: 'scaleUp 0.2s ease-out'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Image card frame */}
              <div style={{ width: '100%', height: '150px', background: 'black', position: 'relative', overflow: 'hidden' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Tag price indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  boxShadow: '0 4px 10px rgba(6,182,212,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Tag size={10} /> ${item.price}
                </div>

                {/* Category label */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  fontWeight: 'bold'
                }}>
                  {item.category}
                </div>
              </div>

              {/* Item Details block */}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }} title={item.title}>
                    {item.title}
                  </h3>
                  <span style={{ fontSize: '9.5px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <MapPin size={9} /> {item.location}
                  </span>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', flex: 1, margin: 0 }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="avatar-placeholder" style={{ width: '20px', height: '20px', fontSize: '8px' }}>
                      {item.seller.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>@{item.seller.username}</span>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => handleMessageSeller(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                      boxShadow: 'none'
                    }}
                  >
                    <Send size={9} /> Message
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SELL AN ITEM CARD MODAL */}
      {sellItemModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '460px' }}>
            <div className="modal-header">
              <h2 className="modal-title">List Trade Item</h2>
              <button className="icon-btn" onClick={() => setSellItemModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateListing}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div className="form-group">
                  <label>Item Name / Title</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="e.g. Mechanical Keyboard"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Price ($)</label>
                    <input
                      className="glass-input"
                      type="number"
                      placeholder="e.g. 150"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select
                      className="glass-input"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ height: '38px', padding: '6px 12px' }}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Rentals">Rentals</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="e.g. San Francisco, US"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Photo/Image URL</label>
                  <input
                    className="glass-input"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Listing Description</label>
                  <textarea
                    className="glass-input"
                    placeholder="Provide details about condition, battery health, features..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    style={{ height: '80px', resize: 'none', padding: '10px' }}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setSellItemModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit" disabled={!newTitle || !newPrice} style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: 'none' }}>Post Listing</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
