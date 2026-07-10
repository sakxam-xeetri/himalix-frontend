import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../store/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../locales/LanguageContext';

export default function Navbar() {
  const { user, logout, systemConfig } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], projects: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], projects: [] });
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/content/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({
            products: data.products || [],
            projects: data.projects || []
          });
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleNavClick = (id) => {
    if (location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.hash = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false);
      if (location.pathname.startsWith('/project')) {
        navigate(`/project?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const isHome = location.pathname === '/';
  const isScrolled = scrolled || !isHome;

  return (
    <nav className={`global-nav${isScrolled ? ' global-nav--scrolled' : ''}`}>
      <div className="global-nav__inner">
        {/* Brand Brand Logo */}
        <Link to="/#" onClick={handleHomeClick} className="global-nav__logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {systemConfig?.siteLogo ? (
            <img 
              src={systemConfig.siteLogo} 
              alt="HX" 
              style={{ 
                height: '24px', 
                width: 'auto',
                filter: 
                  (systemConfig.siteLogoInversion === 'invert_dark' && theme === 'dark') ||
                  (systemConfig.siteLogoInversion === 'invert_light' && theme === 'light') 
                    ? 'invert(1)' 
                    : 'none'
              }} 
            />
          ) : 'HX'}
          <span style={{ color: 'var(--accent)' }}>HIMALIX</span>
        </Link>

        {/* Universal Search Bar */}
        <div className="global-nav__search-container hide-mobile" ref={searchRef}>
          <div className="global-nav__search-inner">
            <input 
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchSubmit}
              className="global-nav__search-input"
            />
            <i className="fa-light fa-sharp fa-magnifying-glass global-nav__search-icon" />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="global-nav__search-clear"
              >
                <i className="fa-light fa-sharp fa-xmark" style={{ fontSize: '12px', color: 'var(--text-3)' }} />
              </button>
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {searchOpen && searchQuery.trim() && (
            <div className="global-nav__search-dropdown" aria-live="polite">
              {searchLoading && <div style={{ textAlign: 'center', padding: '6px', fontSize: '12px', color: 'var(--text-3)' }}>Searching...</div>}
              
              {!searchLoading && searchResults.products.length === 0 && searchResults.projects.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>
                  {t('search.no_results')}
                </div>
              )}

              {/* Products suggestions */}
              {searchResults.products.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
                    {t('search.products')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {searchResults.products.map(p => (
                      <Link 
                        key={p.id} 
                        to={`/store/product/${p.slug || p.id}`}
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', textDecoration: 'none', color: 'inherit' }}
                        className="search-item-row"
                      >
                        <img src={p.image_url || '/placeholder.svg'} alt={p.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={e => { e.target.src = '/placeholder.svg'; }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-0)' }}>{p.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{p.category} • Rs. {Number(p.price).toLocaleString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects suggestions */}
              {searchResults.projects.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
                    {t('search.projects')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {searchResults.projects.map(p => (
                      <Link 
                        key={p.id} 
                        to={`/project/${p.slug || p.id}`}
                        onClick={() => setSearchOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', textDecoration: 'none', color: 'inherit' }}
                        className="search-item-row"
                      >
                        <img src={p.image_url || '/placeholder.svg'} alt={p.name} style={{ width: '28px', height: '28px', objectFit: 'contain' }} onError={e => { e.target.src = '/placeholder.svg'; }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-0)' }}>{p.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{p.type_meta === 'sale' ? 'Buy' : 'Rent'} • Rs. {Number(p.price).toLocaleString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}


            </div>
          )}
        </div>

        {/* Central Navigation Links */}
        <div className="global-nav__links">
          <Link to="/#" onClick={handleHomeClick} className="global-nav__link" title="Go to Himalix Labs Home">{t('nav.home')}</Link>
          <div className="global-nav__dropdown">
            <button className="global-nav__link global-nav__dropdown-trigger" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Browse our services">
              {t('nav.services')} <i className="fa-light fa-sharp fa-chevron-down" style={{ fontSize: '10px' }} />
            </button>
            <div className="global-nav__dropdown-content">
              <Link to="/store" className="global-nav__dropdown-item" title="Shop electronics and modules">{t('nav.store')}</Link>
              <Link to="/project" className="global-nav__dropdown-item" title="Browse engineering projects and source code">{t('nav.projects')}</Link>
              <Link to="/services/3d-printing" className="global-nav__dropdown-item" title="Order custom 3D printing services">{t('nav.printing')}</Link>
              <Link to="/store/track" className="global-nav__dropdown-item" title="Track your order status">Track Order</Link>
            </div>
          </div>
          <button onClick={() => handleNavClick('about')} className="global-nav__link" title="Learn about Himalix Labs">{t('nav.about')}</button>
          <button onClick={() => handleNavClick('team')} className="global-nav__link" title="Meet the Himalix team">{t('nav.team')}</button>
          <button onClick={() => handleNavClick('contact')} className="global-nav__link" title="Send us a message or get support">{t('nav.contact')}</button>
        </div>

        {/* Right side Actions */}
        <div className="global-nav__actions">
          {user && (
            <div className="global-nav__wallet" title="Your Wallet Credits balance">
              <i className="fa-light fa-sharp fa-wallet" />
              <span>Rs. {parseFloat(user.wallet_balance || 0).toLocaleString()}</span>
            </div>
          )}

          <Link to="/store/cart" className="global-nav__cart-btn" aria-label="View Cart" title="View items in your shopping cart">
            <i className="fa-light fa-sharp fa-bag-shopping" />
            {itemCount > 0 && <span className="global-nav__cart-badge">{itemCount}</span>}
          </Link>

          <button onClick={toggleTheme} className="global-nav__theme-btn" title="Toggle theme">
            <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
          </button>

          {user ? (
            <div className="global-nav__profile-dropdown">
              <Link to="/store/profile" className="global-nav__profile-trigger" title="View your user profile and settings">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="global-nav__avatar" />
                ) : (
                  <i className="fa-light fa-sharp fa-user-astronaut" />
                )}
              </Link>
              <div className="global-nav__dropdown-menu">
                <div className="global-nav__dropdown-header">
                  <strong>{user.name || user.email}</strong>
                  <span className="global-nav__dropdown-role">{user.role}</span>
                </div>
                <Link to="/store/profile" className="global-nav__dropdown-item" title="Go to Account Dashboard">
                  <i className="fa-light fa-sharp fa-id-card-clip" /> {t('nav.account')}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="global-nav__dropdown-item global-nav__dropdown-item--admin" title="Go to Admin Panel Dashboard">
                    <i className="fa-light fa-sharp fa-shield-halved" /> {t('nav.admin')}
                  </Link>
                )}
                <button onClick={handleLogout} className="global-nav__dropdown-item text-danger" title="Log out of your account">
                  <i className="fa-light fa-sharp fa-right-from-bracket" /> {t('nav.logout')}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/signin" className="global-nav__signin-btn" title="Log in or Register on Himalix Labs">
              {t('nav.signin')}
            </Link>
          )}

          {/* Hamburger (Mobile Menu) */}
          <button
            className="global-nav__hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            title="Toggle mobile menu navigation"
          >
            <span className={`global-nav__hamburger-bar${mobileOpen ? ' open' : ''}`} />
            <span className={`global-nav__hamburger-bar${mobileOpen ? ' open' : ''}`} />
            <span className={`global-nav__hamburger-bar${mobileOpen ? ' open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="global-nav__mobile-menu">
          <Link to="/" className="global-nav__mobile-link">{t('nav.home')}</Link>
          
          <div className="global-nav__mobile-submenu">
            <span>{t('nav.services')}</span>
            <Link to="/store" className="global-nav__mobile-link">{t('nav.store')}</Link>
            <Link to="/project" className="global-nav__mobile-link">{t('nav.projects')}</Link>
            <Link to="/3d" className="global-nav__mobile-link">{t('nav.printing')}</Link>
          </div>

          <button onClick={() => { handleNavClick('about'); setMobileOpen(false); }} className="global-nav__mobile-link">{t('nav.about')}</button>
          <button onClick={() => { handleNavClick('team'); setMobileOpen(false); }} className="global-nav__mobile-link">{t('nav.team')}</button>
          <button onClick={() => { handleNavClick('contact'); setMobileOpen(false); }} className="global-nav__mobile-link">{t('nav.contact')}</button>
          
          {user ? (
            <>
              <Link to="/store/profile" className="global-nav__mobile-link">{t('nav.account')}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="global-nav__mobile-link admin-link" style={{ color: 'var(--warning)' }}>{t('nav.admin')}</Link>
              )}
              <button onClick={handleLogout} className="global-nav__mobile-link text-danger">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/signin" className="global-nav__mobile-link signin" style={{ color: 'var(--accent)' }}>{t('nav.signin')}</Link>
          )}
        </div>
      )}
    </nav>
  );
}
