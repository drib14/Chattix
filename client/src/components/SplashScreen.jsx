import React from 'react';
import Logo from './Logo';

export default function SplashScreen({ fadeOut }) {
  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-logo-container">
        <Logo size={96} />
        <h1 className="splash-title">Chattix</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
          Secure AI Chat Engine
        </p>
      </div>
      <div className="splash-progress-track">
        <div className="splash-progress-bar"></div>
      </div>
      <div style={{ position: 'absolute', bottom: '40px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>
        DECRYPTING SECURE DIRECT & GROUP CHANNELS
      </div>
    </div>
  );
}
