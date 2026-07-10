import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function StoreFooter() {
  const { systemConfig } = useAuth();
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  // Load helpline phone and support email dynamically from system configuration, or fallback to default values
  const helplinePhone = systemConfig?.emergencyContactPhone || '9801234567';
  const supportEmail = systemConfig?.emergencyContactEmail || 'support@himalix.store';

  const services = [
    { label: 'Himalix Store', to: '/store' },
    { label: '3D Printing', to: '/services/3d-printing' },
    { label: 'Custom Projects', to: '/project?custom=true' },
    { label: 'Himalix Projects', to: '/project' },
  ];

  const legal = [
    { label: 'Terms & Conditions', to: '/store/terms' },
    { label: 'End User License Agreement (EULA)', to: '/store/eula' },
  ];

  const socials = [
    { icon: 'github', url: 'https://github.com/himalixlabs', label: 'GitHub' },
    { icon: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: 'twitter', url: 'https://twitter.com', label: 'Twitter' },
    { icon: 'instagram', url: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-12)' }}>
      <div className="container" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 var(--space-6)' }}>

        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="nav__logo" style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {systemConfig?.siteLogo ? (
                <img 
                  src={systemConfig.siteLogo} 
                  alt="HX" 
                  style={{ 
                    height: '20px', 
                    width: 'auto',
                    filter: 
                      (systemConfig.siteLogoInversion === 'invert_dark' && theme === 'dark') ||
                      (systemConfig.siteLogoInversion === 'invert_light' && theme === 'light') 
                        ? 'invert(1)' 
                        : 'none'
                  }} 
                />
              ) : 'HX'}
              <span style={{ color: 'var(--accent)' }}>STORE</span>
            </div>
            <p className="footer__brand-desc">
              Nepal's premium electronics and tech destination — delivering quality components,
              3D printing filaments, and custom project boards.
            </p>
            <div className="footer__socials">
              {socials.map(s => (
                <a key={s.icon} href={s.url} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label={s.label}>
                  <i className={`fa-brands fa-${s.icon}`} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="footer__col-title">Store Services</div>
            {services.map(s => (
              <Link key={s.label} to={s.to} className="footer__link">{s.label}</Link>
            ))}
          </div>

          {/* Support Contacts */}
          <div>
            <div className="footer__col-title" style={{ color: 'var(--accent)' }}>
              <i className="fa-light fa-sharp fa-headset" style={{ marginRight: '6px' }} />
              Support Contacts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <strong style={{ color: 'var(--text-1)', display: 'block', fontSize: 'var(--text-xxs)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Support Phone:</strong>
                <a href={`tel:${helplinePhone}`} style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>{helplinePhone}</a>
              </div>
              <div>
                <strong style={{ color: 'var(--text-1)', display: 'block', fontSize: 'var(--text-xxs)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Support Email:</strong>
                <a href={`mailto:${supportEmail}`} style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>{supportEmail}</a>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="footer__col-title">Legal</div>
            {legal.map(l => (
              <Link key={l.label} to={l.to} className="footer__link">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} Himalix Labs. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-location-dot" /> Kathmandu, Nepal
          </span>
        </div>
      </div>
    </footer>
  );
}
