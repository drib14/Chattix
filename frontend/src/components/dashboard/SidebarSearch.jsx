import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function SidebarSearch({ onSelectUser }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to search users");
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, getToken]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-chattix-teal/50 shadow-inner"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-chattix-teal w-4 h-4 animate-spin" />}
      </div>

      {query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-md rounded-xl shadow-clay-card border border-gray-100 max-h-60 overflow-y-auto z-50 p-2">
          {results.length === 0 && !loading && (
            <p className="text-center text-gray-500 text-sm py-4">No users found.</p>
          )}
          {results.map(user => (
            <div
              key={user._id}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
              }}
              className="flex items-center gap-3 p-2 hover:bg-chattix-teal/5 rounded-xl cursor-pointer transition-colors"
            >
              <div className="relative">
                <img src={user.profileImageUrl || '/chattix-logo.png'} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</h4>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
              {!user.isOnline && user.lastSeen && (
                <span className="text-[10px] text-green-600 font-medium whitespace-nowrap">
                  {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
