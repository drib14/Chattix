import { SignIn, SignUp } from '@clerk/clerk-react';

const LoginRegister = ({ mode }) => {
  return (
    <div style={styles.container} className="chat-bg-pattern">
      {/* Soft floating blur shapes */}
      <div style={{ ...styles.bubble, ...styles.bubble1 }} />
      <div style={{ ...styles.bubble, ...styles.bubble2 }} />

      <div style={styles.card} className="clay-card animate-pop-in">
        {/* Custom Clay Brand Logo */}
        <div style={styles.logoHeader}>
          <div style={styles.logoIconContainer}>
            <svg style={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 style={styles.logoText}>Chattix</h2>
          <p style={styles.logoSubtext}>
            {mode === 'login' ? 'Sign in to access your chats' : 'Create an account to start messaging'}
          </p>
        </div>

        {/* Clerk Auths widgets configured to merge with Clay index.css rules */}
        <div style={styles.widgetWrapper}>
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
        <div style={styles.footerLink}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <a href="/register" style={styles.link}>Sign up</a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="/login" style={styles.link}>Sign in</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.4,
  },
  bubble1: {
    width: '200px',
    height: '200px',
    background: '#c7d2fe',
    top: '10%',
    left: '12%',
  },
  bubble2: {
    width: '280px',
    height: '280px',
    background: '#fbcfe8',
    bottom: '10%',
    right: '12%',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  },
  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoIconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    background: 'var(--clay-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--clay-shadow-button)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '12px',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    color: '#ffffff',
  },
  logoText: {
    fontSize: '26px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  logoSubtext: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
    fontWeight: 500,
  },
  widgetWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  footerLink: {
    marginTop: '24px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
    width: '100%',
    textAlign: 'center',
    fontWeight: 500,
  },
  link: {
    color: 'var(--clay-primary)',
    textDecoration: 'none',
    fontWeight: 700,
  },
};

export default LoginRegister;
