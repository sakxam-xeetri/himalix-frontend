import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { systemConfig } = useAuth();
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  const services = [
    { label: 'Himalix Store', to: '/store' },
    { label: '3D Printing', to: '/services/3d-printing' },
    { label: 'Custom Projects', to: '/project?custom=true' },
    { label: 'Himalix Projects', to: '/project' },
  ];

  const company = [
    { label: 'About Us', href: '#about' },
    { label: 'Our Team', href: '#team' },
    { label: 'Contact Us', href: '#contact' },
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

  const handleCompanyClick = (href) => {
    const id = href.replace('#', '');
    if (window.location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <footer className="footer">
      <div className="container">

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
              <span style={{ color: 'var(--accent)' }}>LABS</span>
            </div>
            <p className="footer__brand-desc">
              Nepal's emerging technology hub — delivering electronics, 3D printing,
              and custom engineering projects with precision.
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
            <div className="footer__col-title">Services</div>
            {services.map(s => (
              <Link key={s.label} to={s.to} className="footer__link">{s.label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div className="footer__col-title">Company</div>
            {company.map(c => (
              <button
                key={c.label}
                className="footer__link"
                onClick={() => handleCompanyClick(c.href)}
              >
                {c.label}
              </button>
            ))}
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
