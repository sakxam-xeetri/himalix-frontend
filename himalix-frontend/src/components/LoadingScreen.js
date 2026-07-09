import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoadingScreen({ onDone }) {
  const { systemConfig } = useAuth();
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setFade(true);
          setTimeout(onDone, 400);
        }, 200);
      }
      setProgress(Math.min(p, 100));
    }, 80);

    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div
      className="loading-screen"
      style={{
        opacity: fade ? 0 : 1,
        transition: 'opacity 400ms ease',
        pointerEvents: fade ? 'none' : 'auto',
      }}
      aria-label="Loading Himalix Labs"
      role="status"
    >
      <div className="loading-screen__logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {systemConfig?.siteLogo ? (
          <img 
            src={systemConfig.siteLogo} 
            alt="HX" 
            style={{ 
              height: '32px', 
              width: 'auto',
              filter: systemConfig.siteLogoInversion === 'invert_dark' ? 'invert(1)' : 'none'
            }} 
          />
        ) : (
          <>
            HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
          </>
        )}
      </div>
      <div className="loading-screen__bar-track">
        <div
          className="loading-screen__bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
