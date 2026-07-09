import React, { useEffect } from 'react';

export default function BatchToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`batch-toast batch-toast--${type}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#ffffff',
        background: type === 'success' ? '#10b981' : '#ef4444',
        fontSize: '14px',
        fontWeight: 500,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <i className={`fa-light ${type === 'success' ? 'fa-sharp fa-circle-check' : 'fa-sharp fa-circle-exclamation'}`} />
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '2px 4px',
          opacity: 0.8,
          fontSize: '16px',
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        &times;
      </button>
    </div>
  );
}
