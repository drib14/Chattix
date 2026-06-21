import { useEffect, useState } from 'react';

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
    <div className="splash-container flex-center">
      {/* Background organic blur bubbles */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      
      <div className="splash-card clay-card animate-pop-in">
        {/* Unified Clay SVG Logo */}
        <div className="clay-logo-container">
          <Logo />
        </div>

        <h1 className="splash-title">Chattix</h1>
        <p className="splash-subtitle">Minimalist Clay Messaging</p>

        {/* Dynamic Progress Bar */}
        <div className="splash-progress-container">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="splash-progress-text">{progress}%</span>
      </div>
    </div>
  );
};

export default SplashPage;

