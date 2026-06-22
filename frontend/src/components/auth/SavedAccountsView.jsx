import { useState, useEffect } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../../contexts/AuthContext';

export default function SavedAccountsView({ onContinueNew }) {
  // Initialize state synchronously so we don't flash an empty array
  // and trigger the redirect prematurely on the first render.
  const [savedAccounts, setSavedAccounts] = useState(() => {
    return JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
  });

  const navigate = useNavigate();
  const { login } = useAppAuth();

  useEffect(() => {
    if (savedAccounts.length === 0) {
      navigate('/login');
    }
  }, [savedAccounts, navigate]);

  const handleSignIn = async (account) => {
    try {
      // Use the token stored in the saved account object to instantly sign in
      login({
        _id: account._id,
        email: account.email,
        username: account.username,
        firstName: account.name.split(' ')[0], // Best effort reconstruction
        lastName: account.name.split(' ').slice(1).join(' '),
        profileImageUrl: account.avatar,
        token: account.token
      });
      navigate('/');
    } catch (error) {
      console.error("Error signing in with saved account", error);
      navigate('/login', { state: { identifier: account.email } });
    }
  };

  const removeAccount = (accountId, e) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc._id !== accountId);
    setSavedAccounts(updated);
    localStorage.setItem('chattix_saved_accounts', JSON.stringify(updated));
  };

  if (savedAccounts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <img src="/chattix-logo.png" alt="Chattix Logo" className="w-20 h-20 mb-8 drop-shadow-md object-contain" />
      <h2 className="text-2xl font-bold mb-8 text-gray-800">Recent Logins</h2>

      <div className="flex flex-wrap gap-6 justify-center max-w-2xl">
        {savedAccounts.map((account) => (
          <div
            key={account._id}
            onClick={() => handleSignIn(account)}
            className="clay-card p-6 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 relative group w-48"
          >
            <button
              onClick={(e) => removeAccount(account._id, e)}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/50 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={account.avatar}
              alt={account.name}
              className="w-20 h-20 rounded-full mb-4 border-4 border-white shadow-sm object-cover"
            />
            <h3 className="font-semibold text-gray-800 text-center truncate w-full">{account.name}</h3>
          </div>
        ))}

        <div
          onClick={onContinueNew}
          className="clay-card p-6 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 w-48 border-2 border-dashed border-gray-300"
        >
          <div className="w-20 h-20 rounded-full mb-4 bg-gray-100 flex items-center justify-center shadow-inner">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-chattix-teal text-center">Add Account</h3>
        </div>
      </div>
    </div>
  );
}
