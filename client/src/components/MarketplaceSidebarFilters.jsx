import React from 'react';
import { Search, Store, Tag, Laptop, Car, Shirt, Home, Plus } from 'lucide-react';

export default function MarketplaceSidebarFilters({
  category = 'All',
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  priceRange = { min: '', max: '' },
  onPriceChange,
  onSellClick
}) {
  const categoriesList = [
    { name: 'All', icon: <Store size={14} /> },
    { name: 'Electronics', icon: <Laptop size={14} /> },
    { name: 'Vehicles', icon: <Car size={14} /> },
    { name: 'Apparel', icon: <Shirt size={14} /> },
    { name: 'Rentals', icon: <Home size={14} /> }
  ];

  return (
    <div className="sidebar glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.2s ease-out' }}>
      
      {/* Header */}
      <div className="sidebar-header" style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Store size={20} className="text-cyan-glowing" style={{ color: 'var(--accent-cyan)' }} />
          Marketplace
        </h2>
        <button
          className="icon-btn"
          onClick={onSellClick}
          style={{
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            width: '28px',
            height: '28px',
            borderRadius: '50%'
          }}
          title="List an item"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search Input */}
      <div className="sidebar-search" style={{ padding: '12px', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="search-container">
          <Search size={15} className="search-icon" />
          <input
            className="glass-input"
            type="text"
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px', height: '36px' }}
          />
        </div>
      </div>

      {/* Categories Section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', padding: '4px 8px 8px 8px' }}>
          CATEGORIES
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {categoriesList.map((cat) => {
            const isActive = category === cat.name;
            return (
              <div
                key={cat.name}
                onClick={() => onCategoryChange(cat.name)}
                className={`list-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                  transition: 'background 0.2s',
                  color: isActive ? 'var(--accent-cyan)' : 'white'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}>
                  {cat.icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', padding: '0 8px 10px 8px' }}>
            PRICE RANGE
          </div>
          
          <div style={{ display: 'flex', gap: '8px', padding: '0 8px' }}>
            <input
              className="glass-input"
              type="number"
              placeholder="Min ($)"
              value={priceRange.min}
              onChange={(e) => onPriceChange('min', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', fontSize: '11.5px', background: 'rgba(0, 0, 0, 0.2)' }}
            />
            <input
              className="glass-input"
              type="number"
              placeholder="Max ($)"
              value={priceRange.max}
              onChange={(e) => onPriceChange('max', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', fontSize: '11.5px', background: 'rgba(0, 0, 0, 0.2)' }}
            />
          </div>
        </div>

        {/* Fast Action Listing Box */}
        <div style={{ marginTop: '25px', padding: '16px', background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>Got something to trade?</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            List your laptops, keys, and tech gear instantly inside the Chattix Marketplace block.
          </div>
          <button
            className="btn-primary"
            onClick={onSellClick}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              boxShadow: 'none',
              marginTop: '4px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={12} /> Sell item
          </button>
        </div>
      </div>
    </div>
  );
}
