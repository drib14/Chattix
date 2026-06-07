import React from 'react';
import Logo from './UI/Logo';

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
