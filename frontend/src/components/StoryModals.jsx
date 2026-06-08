import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// ----------------------
// Link Modal
// ----------------------
export const LinkModal = ({ isOpen, onClose, onAddLink }) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return toast.error('URL is required');
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    onAddLink({ url: finalUrl, text: text || '🔗 Visit Link' });
    setUrl('');
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold text-lg">Add Link</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white/70 text-xs uppercase font-semibold mb-1 block">URL</label>
            <input 
              type="text" 
              placeholder="example.com" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black/50 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-chattix-primary focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-white/70 text-xs uppercase font-semibold mb-1 block">Link Text (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Visit my site!" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-black/50 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-chattix-primary focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-chattix-primary text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-600 transition-colors">
            Add Link
          </button>
        </form>
      </div>
    </div>
  );
};

// ----------------------
// Location Modal
// ----------------------
export const LocationModal = ({ isOpen, onClose, onAddLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=${import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN}&q=${query}&format=json`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleUseCurrent = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Finding location...', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN}&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const data = await res.json();
        const locName = data.address?.city || data.address?.town || data.address?.country || 'Current Location';
        onAddLocation({ text: locName, lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location added!', { id: 'loc' });
        onClose();
      } catch (err) {
        toast.error('Failed to get location', { id: 'loc' });
      }
    }, () => toast.error('Location access denied', { id: 'loc' }));
  };

  const handleSelect = (item) => {
    const locName = item.address?.name || item.address?.city || item.address?.country || item.display_name.split(',')[0];
    onAddLocation({ text: locName, lat: item.lat, lng: item.lon });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search size={20} className="text-white/50" />
          <input 
            type="text" 
            placeholder="Search location..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white flex-1 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <button onClick={handleUseCurrent} className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-xl text-blue-400 font-medium">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            Use Current Location
          </button>
          
          {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-white/50" /></div>}
          
          {results.map((item, idx) => (
            <button key={idx} onClick={() => handleSelect(item)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/70">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.address?.name || item.display_name.split(',')[0]}</p>
                <p className="text-white/50 text-xs truncate">{item.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------------
// Giphy Modal
// ----------------------
export const GiphyModal = ({ isOpen, onClose, onAddSticker }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchGifs('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchGifs(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchGifs = async (search) => {
    setLoading(true);
    try {
      const endpoint = search.trim() 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${import.meta.env.VITE_GIPHY_API_KEY}&q=${search}&limit=30` 
        : `https://api.giphy.com/v1/gifs/trending?api_key=${import.meta.env.VITE_GIPHY_API_KEY}&limit=30`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch gifs', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 flex flex-col h-[70vh] sm:h-[600px]">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search size={20} className="text-white/50" />
          <input 
            type="text" 
            placeholder="Search Giphy..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white flex-1 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading && gifs.length === 0 ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/50" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gifs.map(gif => (
                <button 
                  key={gif.id} 
                  onClick={() => {
                    onAddSticker({ url: gif.images.fixed_height.url });
                    onClose();
                  }}
                  className="aspect-square bg-white/5 rounded-xl overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img src={gif.images.fixed_height.url} alt={gif.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 text-center text-[10px] text-white/30 font-bold uppercase tracking-widest border-t border-white/5">
          Powered by GIPHY
        </div>
      </div>
    </div>
  );
};
