import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';

export default function Auth() {
  const { registerUser, verifyCode, loginUser, forgotPassword, resetPassword, loading } = useApp();
  const [view, setView] = useState('login'); // login, register, verify, forgot, reset

  // Auth fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Verification / Reset details
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  
  // Dev Helper Bypasses
  const [devCode, setDevCode] = useState('');

  // Handle Register submit
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    const res = await registerUser(username, email, password);
    if (res.success) {
      setDevCode(res.bypassCode || '');
      // Copy bypass code to clipboard automatically
      if (res.bypassCode) {
        navigator.clipboard.writeText(res.bypassCode);
      }
      setView('verify');
    }
  };

  // Handle Verify submit
  const handleVerify = async (e) => {
    e.preventDefault();
    const joinedCode = verificationCode.join('');
    if (joinedCode.length < 6) return;
    await verifyCode(email, joinedCode);
  };

  // Handle Login submit
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) return;
    const res = await loginUser(loginIdentifier, password);
    if (res.success === false && res.isNotVerified) {
      setEmail(res.email);
      setDevCode(res.bypassCode || '');
      if (res.bypassCode) {
        navigator.clipboard.writeText(res.bypassCode);
      }
      setView('verify');
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return;
    const res = await forgotPassword(email);
    if (res.success) {
      setDevCode(res.bypassCode || '');
      if (res.bypassCode) {
        navigator.clipboard.writeText(res.bypassCode);
      }
      setView('reset');
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const joinedCode = resetCode.join('');
    if (joinedCode.length < 6 || !newPassword) return;
    const res = await resetPassword(email, joinedCode, newPassword);
    if (res.success) {
      setView('login');
      // Wipe fields
      setResetCode(['', '', '', '', '', '']);
      setNewPassword('');
    }
  };

  // Handle digit navigation inside 6-digit box
  const handleCodeChange = (index, value, codeArray, setCodeArray, nextElementId) => {
    if (isNaN(value)) return;
    const newCode = [...codeArray];
    newCode[index] = value.substring(value.length - 1);
    setCodeArray(newCode);

    if (value && nextElementId) {
      const nextInput = document.getElementById(nextElementId);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e, codeArray, setCodeArray, prevElementId) => {
    if (e.key === 'Backspace' && !codeArray[index] && prevElementId) {
      const prevInput = document.getElementById(prevElementId);
      if (prevInput) {
        prevInput.focus();
        const newCode = [...codeArray];
        newCode[index - 1] = '';
        setCodeArray(newCode);
      }
    }
  };

  return (
    <div className="auth-container">
      {/* Dev helper code banner */}
      {devCode && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '12px',
          padding: '12px 24px',
          color: '#06b6d4',
          fontSize: '13px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.15)',
          zIndex: 50,
          animation: 'slideUp 0.3s ease-out'
        }}>
          💡 <strong>Developer Mode:</strong> Bypass code generated for <strong>{email}</strong> is <strong>{devCode}</strong> (auto-copied).
        </div>
      )}

      {/* LOGIN CARD */}
      {view === 'login' && (
        <div className="auth-card glass-panel">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Logo size={68} />
            <h1 style={{ marginTop: '4px' }}>Chattix</h1>
            <p>Welcome to the future of AI chat.</p>
          </div>
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username or Email</label>
              <input
                className="glass-input"
                type="text"
                placeholder="Enter email or username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <span
                  style={{ color: '#06b6d4', fontSize: '11px', cursor: 'pointer' }}
                  onClick={() => setView('forgot')}
                >
                  Forgot Password?
                </span>
              </div>
              <input
                className="glass-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Entering Chattix...' : 'Login Session'}
            </button>
          </form>
          <div className="auth-toggle">
            Don't have an account? <span onClick={() => setView('register')}>Register</span>
          </div>
        </div>
      )}

      {/* REGISTER CARD */}
      {view === 'register' && (
        <div className="auth-card glass-panel">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Logo size={68} />
            <h1 style={{ marginTop: '4px' }}>Create Account</h1>
            <p>Step into the premium MERN experience.</p>
          </div>
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="glass-input"
                type="text"
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="glass-input"
                type="email"
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="glass-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating Identity...' : 'Join Chattix'}
            </button>
          </form>
          <div className="auth-toggle">
            Already have an account? <span onClick={() => setView('login')}>Login</span>
          </div>
        </div>
      )}

      {/* VERIFY EMAIL CARD */}
      {view === 'verify' && (
        <div className="auth-card glass-panel">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Logo size={68} />
            <h1 style={{ marginTop: '4px' }}>Verify Email</h1>
            <p>We've sent a 6-digit confirmation code to <strong>{email}</strong>.</p>
          </div>
          <form className="auth-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label style={{ textAlign: 'center', display: 'block', width: '100%' }}>Enter verification code</label>
              <div className="code-digits-container">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`vcode-${index}`}
                    className="digit-box"
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) =>
                      handleCodeChange(
                        index,
                        e.target.value,
                        verificationCode,
                        setVerificationCode,
                        index < 5 ? `vcode-${index + 1}` : ''
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(
                        index,
                        e,
                        verificationCode,
                        setVerificationCode,
                        index > 0 ? `vcode-${index - 1}` : ''
                      )
                    }
                    required
                  />
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Checking Signature...' : 'Confirm Verification'}
            </button>
          </form>
          <div className="auth-toggle">
            Entered wrong email? <span onClick={() => setView('register')}>Start over</span>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD CARD */}
      {view === 'forgot' && (
        <div className="auth-card glass-panel">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Logo size={68} />
            <h1 style={{ marginTop: '4px' }}>Forgot Password</h1>
            <p>Request a secure password recovery code.</p>
          </div>
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="glass-input"
                type="email"
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Requesting Reset...' : 'Send Recovery Code'}
            </button>
          </form>
          <div className="auth-toggle">
            Remembered? <span onClick={() => setView('login')}>Back to Login</span>
          </div>
        </div>
      )}

      {/* RESET PASSWORD CARD */}
      {view === 'reset' && (
        <div className="auth-card glass-panel">
          <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Logo size={68} />
            <h1 style={{ marginTop: '4px' }}>Reset Password</h1>
            <p>Setup a new strong password for your account.</p>
          </div>
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label style={{ textAlign: 'center', display: 'block', width: '100%' }}>Recovery Code</label>
              <div className="code-digits-container">
                {resetCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`rcode-${index}`}
                    className="digit-box"
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) =>
                      handleCodeChange(
                        index,
                        e.target.value,
                        resetCode,
                        setResetCode,
                        index < 5 ? `rcode-${index + 1}` : ''
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(
                        index,
                        e,
                        resetCode,
                        setResetCode,
                        index > 0 ? `rcode-${index - 1}` : ''
                      )
                    }
                    required
                  />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                className="glass-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
          <div className="auth-toggle">
            Decided otherwise? <span onClick={() => setView('login')}>Cancel</span>
          </div>
        </div>
      )}
    </div>
  );
}
