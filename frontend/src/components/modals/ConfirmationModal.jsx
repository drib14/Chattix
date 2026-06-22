import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'popIn 0.2s ease-out'
    }}>
      <div className="clay-card" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '24px 32px',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--clay-danger-light)',
          color: 'var(--clay-danger)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <AlertCircle size={32} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(226, 232, 240, 0.8)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--clay-danger), #e11d48)',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
              boxShadow: '0 8px 16px rgba(244, 63, 94, 0.2)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
