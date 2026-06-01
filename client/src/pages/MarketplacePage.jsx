import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ShoppingBag, Send, Tag, MapPin } from 'lucide-react';

export default function MarketplacePage() {
  const { contacts, createChat, sendMessage, showToast, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-populated high-end mockup items
  const marketplaceItems = [
    {
      id: 'item_1',
      title: 'iPhone 15 Pro Max - Slate Gray (256GB)',
      price: 999,
      location: 'Manila, PH',
      description: 'Used for 2 months, 99% battery health. Comes with original box and accessories.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
      seller: contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2e8', username: 'chattix_seller_alpha' }
    },
    {
      id: 'item_2',
      title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
      price: 280,
      location: 'New York, US',
      description: 'Mint condition, pristine sound. Only used once in transit.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
      seller: contacts[1] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2e9', username: 'chattix_seller_beta' }
    },
    {
      id: 'item_3',
      title: 'MacBook Pro 14" M3 (16GB/512GB)',
      price: 1450,
      location: 'San Francisco, US',
      description: 'Space Black version. Selling because of company upgrade. Warranty active.',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
      seller: contacts[2] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2f0', username: 'chattix_seller_gamma' }
    },
    {
      id: 'item_4',
      title: 'Mechanical Cyberpunk Keyboard - Custom Gateron Switches',
      price: 120,
      location: 'Tokyo, JP',
      description: 'Dynamic RGB, customizable hot-swappable keycaps. High-end typing acoustics.',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
      seller: contacts[3] || contacts[0] || { _id: '64f7b2e8d2e8d2e8d2e8d2f1', username: 'chattix_seller_delta' }
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
        
        // Dynamic import logic to avoid blockages, directly using MERN messenger
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

  const filteredItems = marketplaceItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="marketplace-page-container" style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '30px 40px',
      background: 'radial-gradient(circle at 10% 20%, rgba(6,182,212,0.04) 0%, transparent 45%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', background: 'linear-gradient(135deg, white 40%, var(--accent-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Marketplace replica
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Explore local tech items and communicate with sellers instantly via integrated chats.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', padding: '6px 12px', borderRadius: '8px', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: 'bold' }}>
          <ShoppingBag size={14} /> 2026 Trading Protocol Active
        </div>
      </div>

      {/* Search Console */}
      <div className="search-container" style={{ maxWidth: '480px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '4px 12px', borderRadius: '10px' }}>
        <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
        <input
          className="glass-input"
          type="text"
          placeholder="Search items for trade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '6px 0', fontSize: '13px', boxShadow: 'none' }}
        />
      </div>

      {/* Items Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginTop: '10px' }}>
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
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Image card frame */}
            <div style={{ width: '100%', height: '170px', background: 'black', position: 'relative', overflow: 'hidden' }}>
              <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Tag price indicator */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '13px',
                boxShadow: '0 4px 10px rgba(6,182,212,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Tag size={12} /> ${item.price}
              </div>
            </div>

            {/* Item Details block */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                  {item.title}
                </h3>
                <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={10} /> {item.location}
                </span>
              </div>

              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="avatar-placeholder" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                    {item.seller.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{item.seller.username}</span>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => handleMessageSeller(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    boxShadow: 'none'
                  }}
                >
                  <Send size={10} /> Message
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
