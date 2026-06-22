import React, { useState } from 'react';
import { Search } from 'lucide-react';

const GiphySearch = ({ onGifSelect }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
      if (!apiKey) {
        console.error('Missing Giphy API Key');
        return;
      }
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      setGifs(data.data);
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px', width: '280px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
      <form onSubmit={searchGifs} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="clay-input"
          style={{ padding: '8px 12px', fontSize: '13px', flex: 1 }}
        />
        <button type="submit" className="chat-window-opt-btn" style={{ width: '36px', height: '36px' }}>
          <Search size={16} />
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / span 2', padding: '20px', color: 'var(--text-light)' }}>Loading...</div>
        ) : (
          gifs.map(gif => (
            <img
              key={gif.id}
              src={gif.images.fixed_height_small.url}
              alt="GIF"
              style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => onGifSelect(gif.images.original.url)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GiphySearch;
