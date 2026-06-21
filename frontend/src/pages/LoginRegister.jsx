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
    <div className="auth-container flex-center chat-bg-pattern">
      {/* Soft floating blur shapes */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      <div className="auth-card clay-card animate-pop-in">
        {/* Custom Clay Brand Logo */}
        <div className="auth-header">
          <div className="clay-logo-container">
            <Logo />
          </div>
          <h2 className="auth-title">Chattix</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to access your chats' : 'Create an account to start messaging'}
          </p>
        </div>

        {/* Clerk Auths widgets configured to merge with Clay index.css rules */}
        <div className="auth-widget-wrapper">
          {mode === 'login' ? (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent p-0 w-full',
                  header: 'hidden',
                  footer: 'hidden',
                  formButtonPrimary: 'clay-btn clay-btn-primary w-full py-3 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all',
                  formFieldInput: 'clay-input border-slate-200 focus:border-indigo-500 bg-slate-50/50',
                  formFieldLabel: 'text-xs font-semibold text-slate-600 uppercase tracking-wider',
                  identityPreviewText: 'text-slate-700 font-medium',
                  identityPreviewEditButton: 'text-indigo-600 hover:text-indigo-800 font-semibold',
                  dividerLine: 'bg-slate-200',
                  dividerText: 'text-slate-400 text-xs font-medium uppercase',
                  socialButtonsBlockButton: 'clay-btn clay-btn-secondary border border-slate-200 hover:bg-slate-50 w-full flex items-center justify-center py-2.5 rounded-xl text-slate-600 font-medium text-sm',
                  socialButtonsBlockButtonText: 'text-slate-600 font-semibold text-sm',
                  formFieldAction: 'text-indigo-600 hover:text-indigo-800 text-xs font-semibold',
                  alert: 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3',
                }
              }}
            />
          ) : (
            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent p-0 w-full',
                  header: 'hidden',
                  footer: 'hidden',
                  formButtonPrimary: 'clay-btn clay-btn-primary w-full py-3 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all',
                  formFieldInput: 'clay-input border-slate-200 focus:border-indigo-500 bg-slate-50/50',
                  formFieldLabel: 'text-xs font-semibold text-slate-600 uppercase tracking-wider',
                  dividerLine: 'bg-slate-200',
                  dividerText: 'text-slate-400 text-xs font-medium uppercase',
                  socialButtonsBlockButton: 'clay-btn clay-btn-secondary border border-slate-200 hover:bg-slate-50 w-full flex items-center justify-center py-2.5 rounded-xl text-slate-600 font-medium text-sm',
                  socialButtonsBlockButtonText: 'text-slate-600 font-semibold text-sm',
                  alert: 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3',
                }
              }}
            />
          )}
        </div>

        {/* Custom styled redirect text */}
        <div className="auth-footer-link">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <a href="/register" className="auth-link">Sign up</a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="/login" className="auth-link">Sign in</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

