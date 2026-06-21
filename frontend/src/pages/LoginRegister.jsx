import { SignIn, SignUp } from '@clerk/clerk-react';

const Logo = ({ className = "brand-logo-svg" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a5b4fc" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbcfe8" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="26" fill="url(#bgGrad)" />
    <path d="M 35 85 L 45 70 L 25 70 Z" fill="#6366f1" />
    <path d="M 30 30 Q 50 15 70 30" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.35" />
    <circle cx="70" cy="70" r="18" fill="url(#accentGrad)" />
    <path d="M 62 62 Q 70 54 78 62" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45" />
  </svg>
);

const LoginRegister = ({ mode }) => {
  return (
    <div className="auth-container flex-center chat-bg-pattern" style={{ flexDirection: 'column', gap: '20px', minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box' }}>
      {/* Soft floating blur shapes */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Brand Logo Header */}
      <div className="flex-center" style={{ flexDirection: 'column', gap: '10px', zIndex: 10 }}>
        <div className="clay-logo-container" style={{ width: '60px', height: '60px' }}>
          <Logo />
        </div>
        <h2 className="auth-title" style={{ fontSize: '28px', color: '#1e293b', margin: 0, fontWeight: 800 }}>Chattix</h2>
      </div>

      {/* Clerk prebuilt auth widgets */}
      <div className="animate-pop-in" style={{ zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {mode === 'login' ? (
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/register"
            fallbackRedirectUrl="/messages"
          />
        ) : (
          <SignUp
            path="/register"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/messages"
          />
        )}
      </div>
    </div>
  );
};

export default LoginRegister;
