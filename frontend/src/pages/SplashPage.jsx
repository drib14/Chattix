import { useEffect, useState } from 'react';

const SplashPage = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment loader progress smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 400); // Small pause for completeness
          return 100;
        }
        return prev + 4;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div style={styles.container}>
      {/* Background organic blur bubbles */}
      <div style={{ ...styles.bubble, ...styles.bubble1 }} />
      <div style={{ ...styles.bubble, ...styles.bubble2 }} />
      
      <div style={styles.card} className="clay-card">
        {/* Clay SVG Logo */}
        <div style={styles.logoWrapper} className="pulse-logo">
          <svg style={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        <h1 style={styles.title}>Chattix</h1>
        <p style={styles.subtitle}>Minimalist Clay Messaging</p>

        {/* Dynamic Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
        <span style={styles.progressText}>{progress}%</span>
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
    background: '#f1f5f9',
    position: 'relative',
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.45,
  },
  bubble1: {
    width: '250px',
    height: '250px',
    background: '#a5b4fc',
    top: '15%',
    left: '15%',
  },
  bubble2: {
    width: '320px',
    height: '320px',
    background: '#fbcfe8',
    bottom: '15%',
    right: '15%',
  },
  card: {
    padding: '48px 40px',
    width: '90%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
  },
  logoWrapper: {
    width: '72px',
    height: '72px',
    borderRadius: '22px',
    background: 'var(--clay-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--clay-shadow-button)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    marginBottom: '20px',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    color: '#ffffff',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginBottom: '32px',
  },
  progressContainer: {
    width: '100%',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginBottom: '8px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: '100%',
    background: 'var(--clay-primary)',
    borderRadius: '9999px',
    transition: 'width 0.1s ease-out',
  },
  progressText: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--clay-primary)',
  },
};

export default SplashPage;
