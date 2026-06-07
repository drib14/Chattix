import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { User, UserCheck, X, KeyRound, ShieldCheck, ArrowRight, LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import api from '../api/axios';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  
  // States for the post-login save banner
  const [showPostLoginBanner, setShowPostLoginBanner] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('chattix_saved_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedAccounts(Array.isArray(parsed) ? parsed.filter(acc => acc && acc.user) : []);
      } catch (e) {
        setSavedAccounts([]);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;

      // Check if this account is already saved
      const saved = localStorage.getItem('chattix_saved_accounts');
      const savedList = saved ? JSON.parse(saved).filter(acc => acc && acc.user) : [];
      const currentId = user.id || user._id;
      const isAlreadySaved = savedList.some((acc) => (acc.user.id || acc.user._id) === currentId);

      if (isAlreadySaved) {
        // If already saved, proceed directly to dashboard
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('chattix_logged_via_quick_login');
        navigate('/dashboard');
      } else {
        // Show the banner to describe saving the account
        setTempAuthData(response.data);
        setShowPostLoginBanner(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account) => {
    localStorage.setItem('token', account.token);
    localStorage.setItem('user', JSON.stringify(account.user));
    localStorage.setItem('chattix_logged_via_quick_login', 'true'); // flag as quick login
    navigate('/dashboard');
  };

  const handleRemoveAccount = (e, accountId) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(acc => acc && acc.user && (acc.user.id || acc.user._id) !== accountId);
    setSavedAccounts(updated);
    localStorage.setItem('chattix_saved_accounts', JSON.stringify(updated));
  };

  const handleSaveAndContinue = () => {
    if (!tempAuthData) return;
    const { token, user } = tempAuthData;

    const saved = localStorage.getItem('chattix_saved_accounts');
    const savedList = saved ? JSON.parse(saved).filter(acc => acc && acc.user) : [];
    const currentId = user.id || user._id;

    if (currentId && !savedList.some((acc) => (acc.user.id || acc.user._id) === currentId)) {
      savedList.push({ token, user });
      localStorage.setItem('chattix_saved_accounts', JSON.stringify(savedList));
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('chattix_logged_via_quick_login');
    navigate('/dashboard');
  };

  const handleSkipAndContinue = () => {
    if (!tempAuthData) return;
    const { token, user } = tempAuthData;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('chattix_logged_via_quick_login');
    navigate('/dashboard');
  };

  // Render the Successful Login Banner screen if triggered
  if (showPostLoginBanner && tempAuthData) {
    return (
      <AuthLayout title="Save Account?" subtitle="Enable quick switching in this browser">
        <div className="login-success-banner" style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <KeyRound size={28} style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Save Account?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Securely save <strong>@{tempAuthData.user.username}</strong> on this browser for quick switching.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={handleSaveAndContinue}
              style={{
                background: 'var(--text-primary)',
                color: '#000',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <ShieldCheck size={16} style={{ marginRight: '0.5rem' }} />
              Save & Continue
            </button>
            <button 
              onClick={handleSkipAndContinue}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.75rem',
                borderRadius: '0.25rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      {error && <div className="error-message">{error}</div>}

      {savedAccounts.length > 0 && (
        <div className="saved-accounts-section">
          <h3 className="saved-accounts-title">
            <UserCheck size={16} className="saved-accounts-icon" />
            Quick Switch
          </h3>
          <div className="saved-accounts-grid">
            {savedAccounts.map((account) => {
              const accountId = account.user.id || account.user._id;
              return (
                <div 
                  key={accountId} 
                  className="saved-account-card"
                  onClick={() => handleQuickLogin(account)}
                >
                  <button 
                    className="remove-account-btn"
                    onClick={(e) => handleRemoveAccount(e, accountId)}
                    title="Remove Saved Profile"
                  >
                  <X size={12} />
                </button>
                <div className="saved-account-avatar">
                  <User size={18} />
                </div>
                <div className="saved-account-info">
                  <span className="saved-account-name">{account.user.firstName} {account.user.lastName}</span>
                  <span className="saved-account-username">@{account.user.username}</span>
                </div>
              </div>
              );
            })}
          </div>
          <div className="saved-accounts-divider">
            <span>or sign in with password</span>
          </div>
        </div>
      )}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="identifier">Username or Email</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            className="form-input"
            value={formData.identifier}
            onChange={handleChange}
            required
            placeholder="johndoe@example.com"
          />
        </div>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <RouterLink to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</RouterLink>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account? <RouterLink to="/register" className="auth-link">Sign up</RouterLink>
      </div>
    </AuthLayout>
  );
};

export default Login;
