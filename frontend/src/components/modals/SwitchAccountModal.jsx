import { useState, useEffect } from 'react';
import { useAppAuth } from '../../contexts/AuthContext';
import { X, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SwitchAccountModal({ isOpen, onClose }) {
  const { login, logout, dbUser } = useAppAuth();
  const navigate = useNavigate();
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(JSON.parse(localStorage.getItem('chattix_saved_accounts') || '[]'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitch = (account) => {
    login({ token: account.token, _id: account._id, email: account.email, username: account.username, firstName: account.name.split(' ')[0], lastName: account.name.split(' ')[1] || '', profileImageUrl: account.avatar });
    onClose();
    // reload to reset socket connection and redux state
    window.location.href = '/';
  };

  const handleAddAccount = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const removeAccount = (accountId, e) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc._id !== accountId);
    setSavedAccounts(updated);
    localStorage.setItem('chattix_saved_accounts', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-chattix-bg/80 backdrop-blur-sm p-4">
      <div className="clay-card rounded-3xl max-w-md w-full flex flex-col relative max-h-[80vh]">
        <div className="p-4 flex items-center justify-between z-10 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 ml-2">Switch Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 clay-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {savedAccounts.map((account) => {
            const isActive = dbUser && dbUser._id === account._id;
            return (
              <div
                key={account._id}
                onClick={() => !isActive && handleSwitch(account)}
                className={`flex items-center justify-between p-3 rounded-2xl border-transparent transition-all duration-200 ${isActive ? 'shadow-clay-inset bg-gray-50' : 'clay-card cursor-pointer hover:shadow-clay-inset'}`}
              >
                <div className="flex items-center gap-3">
                  <img src={account.avatar || '/chattix-logo.png'} alt={account.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{account.name}</span>
                    <span className="text-xs text-gray-500">@{account.username}</span>
                  </div>
                </div>
                {isActive && (
                  <span className="text-xs font-semibold text-chattix-teal px-2 py-1 bg-chattix-teal/10 rounded-lg">Active</span>
                )}
                {!isActive && (
                  <button
                    onClick={(e) => removeAccount(account._id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors bg-white/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {savedAccounts.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">No other accounts saved.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleAddAccount}
            className="w-full clay-btn flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-chattix-teal transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Sign into another account
          </button>
        </div>

      </div>
    </div>
  );
}
