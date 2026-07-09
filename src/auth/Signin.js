import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Signin() {
  const { login, user, systemConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  /* Redirect if already logged in */
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error?.message || data.message || '';
        const errCode = data.error?.code || '';
        if (res.status === 403 && (errCode === 'EMAIL_NOT_VERIFIED' || errMsg.toLowerCase().includes('not verified') || errMsg.toLowerCase().includes('verification'))) {
          navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
          return;
        }
        throw new Error(errMsg || 'Invalid credentials');
      }
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotEmail) {
      setError('Email address is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request password reset');
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Google Sign-In callback */
  useEffect(() => {
    if (showForgotPassword || !systemConfig?.googleAuthEnabled || !systemConfig?.googleClientId || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: systemConfig.googleClientId,
      callback: async (response) => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
          login(data.token, data.user);
          navigate(from, { replace: true });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
    });

    const btnEl = document.getElementById('google-btn-signin');
    let resizeObserver;
    if (btnEl) {
      resizeObserver = new ResizeObserver((entries) => {
        const parentWidth = entries[0]?.contentRect.width || btnEl.parentElement?.offsetWidth || 352;
        const width = Math.min(400, Math.max(200, Math.floor(parentWidth)));
        window.google.accounts.id.renderButton(
          btnEl,
          { type: 'standard', theme: 'filled_black', size: 'large', width: width }
        );
      });
      if (btnEl.parentElement) {
        resizeObserver.observe(btnEl.parentElement);
      }
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [systemConfig, showForgotPassword]);
  
  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <aside className="auth-panel" aria-hidden="true" onMouseMove={handleMouseMove}>
        <div className="auth-panel__grid" />
        <div className="auth-panel__glow" />
        <div className="auth-panel__content">
          <div className="auth-panel__logo">
            <span>HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span></span>
            <div className="auth-status-badge">
              <span className="auth-status-dot" />
              SYS ACTIVE
            </div>
          </div>
          <div className="auth-panel__tagline">
            <h2>Nepal's technology access center.</h2>
            <p>Sign in to shop electronics, track orders, manage your wallet, and access all Himalix services.</p>
          </div>
        </div>
        <div className="auth-panel__footer">
          <div className="auth-panel__services">
            {[
              { icon: 'store', label: 'Himalix Store — Electronics & More' },
              { icon: 'cube', label: 'Himalix 3D — Custom Prints' },
              { icon: 'globe', label: 'Himalix Web — Digital Solutions' },
              { icon: 'code', label: 'Himalix Projects — Software Dev' },
            ].map(({ icon, label }) => (
              <div key={icon} className="auth-panel__service-item">
                <i className={`fa-light fa-sharp fa-${icon}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-form-box">
            {!showForgotPassword ? (
              <div className="auth-fade-in">
                <div className="auth-form-box__header">
                  <div className="auth-form-box__eyebrow">Welcome back</div>
                  <h1 className="auth-form-box__title">Sign in</h1>
                  <p className="auth-form-box__subtitle">Access your Himalix account</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fa-light fa-sharp fa-circle-exclamation" />
                    <span>{error}</span>
                  </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  {/* Google Sign-In */}
                  {systemConfig?.googleAuthEnabled && systemConfig?.googleClientId && (
                    <>
                      <div id="google-btn-signin" style={{ width: '100%' }} />
                      <div className="auth-separator">or</div>
                    </>
                  )}

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="signin-email" className="form-label">Email</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="signin-email"
                        name="email"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        disabled={loading}
                      />
                      <i className="fa-light fa-sharp fa-envelope auth-input-icon" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="signin-password" className="form-label">Password</label>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-2)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: 0,
                          marginBottom: 'var(--space-1)',
                          transition: 'color var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--text-0)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--text-2)'}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper auth-input-wrapper--password">
                      <input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <i className="fa-light fa-sharp fa-lock auth-input-icon" />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        tabIndex="-1"
                      >
                        <i className={`fa-light fa-sharp fa-eye${showPassword ? '-slash' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg auth-submit-btn"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
                      : <><i className="fa-light fa-sharp fa-arrow-right-to-bracket" /> Sign In</>
                    }
                  </button>
                </form>

                <div className="auth-switch">
                  Don't have an account? <Link to="/signup">Create one</Link>
                </div>
              </div>
            ) : (
              <div className="auth-fade-in">
                <div className="auth-form-box__header">
                  <div className="auth-form-box__eyebrow">Recover account</div>
                  <h1 className="auth-form-box__title">Reset Password</h1>
                  <p className="auth-form-box__subtitle">Enter your email to request a reset link</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fa-light fa-sharp fa-circle-exclamation" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    <i className="fa-light fa-sharp fa-circle-check" />
                    <span>{success}</span>
                  </div>
                )}

                <form className="auth-form" onSubmit={handleForgotPasswordSubmit} noValidate>
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="forgot-email" className="form-label">Email</label>
                    <div className="auth-input-wrapper">
                      <input
                        id="forgot-email"
                        name="forgotEmail"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoComplete="email"
                        disabled={loading}
                      />
                      <i className="fa-light fa-sharp fa-envelope auth-input-icon" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg auth-submit-btn"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending link…</>
                      : <><i className="fa-light fa-sharp fa-paper-plane" /> Send Reset Link</>
                    }
                  </button>
                </form>

                <div className="auth-switch">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
