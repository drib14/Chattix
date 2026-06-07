import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const GlobalSearchBar = ({ onSearch, onClear, placeholder = 'Search people, groups or conversations...' }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    setSearchValue('');
    if (onClear) onClear();
  };

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-2.5 bg-chattix-bg border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-chattix-primary/30 focus:border-chattix-primary transition-all"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default GlobalSearchBar;
