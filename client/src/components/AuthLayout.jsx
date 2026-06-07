import React from 'react';

const Logo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="chattix-logo-svg">
    <rect width="512" height="512" rx="128" fill="var(--text-primary)" />
    <path d="M220,180 C150,180 100,215 100,270 C100,325 150,360 220,360 C235,360 260,355 275,350 L330,375 L320,335 C335,320 340,295 340,270 C340,215 290,180 220,180 Z" fill="#000" />
    <path d="M292,130 C222,130 172,165 172,220 C172,245 177,270 192,285 L182,325 L237,300 C252,305 277,310 292,310 C362,310 412,275 412,220 C412,165 362,130 292,130 Z" fill="#050505" />
  </svg>
);

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <Logo size={42} />
            <span>Chattix</span>
          </div>
          <h2 style={{ marginBottom: '0.25rem', marginTop: '1.5rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.5rem' }}>{title}</h2>
          <p className="auth-subtitle" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
