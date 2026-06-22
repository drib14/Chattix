import { useState, useEffect } from 'react';
import { useSignIn, useClerk } from '@clerk/clerk-react';
import { LogIn, UserPlus, X } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function SavedAccountsView({ onContinueNew }) {
  // Initialize state synchronously so we don't flash an empty array
  // and trigger the redirect prematurely on the first render.
  const [savedAccounts, setSavedAccounts] = useState(() => {
    return JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]');
  });

  const { isLoaded, signIn } = useSignIn();
  const { setActive, client } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    if (savedAccounts.length === 0) {
      navigate('/login');
    }
  }, [savedAccounts, navigate]);

  const handleSignIn = async (account) => {
    if (!isLoaded || !client) return;

    try {
      // Check if Clerk has an active/available session for this user ID
      const existingSession = client.sessions.find(
        (session) => session.user.id === account.clerkId
      );

      if (existingSession) {
        // If session exists in background, instantly switch to it
        await setActive({ session: existingSession.id });
        navigate('/');
      } else {
        // If the session has completely expired but the account is known to be Google-linked,
        // we can try to seamlessly redirect to Google again, passing the login hint.
        signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/',
          redirectUrlComplete: '/',
        });
      }
    } catch (error) {
      console.error("Error signing in with saved account", error);
      navigate('/login', { state: { identifier: account.email } });
    }
  };

  const removeAccount = (clerkId, e) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc.clerkId !== clerkId);
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
            key={account.clerkId}
            onClick={() => handleSignIn(account)}
            className="glass clay-card p-6 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 relative group w-48"
          >
            <button
              onClick={(e) => removeAccount(account.clerkId, e)}
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
          className="glass clay-card p-6 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 w-48 border-2 border-dashed border-gray-300"
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
