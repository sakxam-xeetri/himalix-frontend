import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function VerifyEmail() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Redirect if already logged in or if email is missing
  useEffect(() => {
    if (user) {
      navigate('/store');
    }
  }, [user, navigate]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Verification failed');
      }
      
      setSuccess('Account verified successfully! Logging you in...');
      setTimeout(() => {
        login(data.token, data.user);
        navigate('/store');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Resend failed');
      }
      
      setSuccess('A new verification code has been sent to your email.');
      setTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

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
            <h2>Account Security Verification.</h2>
            <p>We need to verify the authenticity of your email address before you can log in. Please check your inbox for the OTP code.</p>
          </div>
        </div>
        <div className="auth-panel__footer">
          <div className="auth-panel__services">
            <div className="auth-panel__service-item">
              <i className="fa-light fa-sharp fa-envelope-open" />
              <span>Enter the 6-digit OTP code sent to {email || 'your email'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-form-box">
            <div className="auth-fade-in">
              <div className="auth-form-box__header">
                <div className="auth-form-box__eyebrow">Verification Required</div>
                <h1 className="auth-form-box__title">Verify Email</h1>
                <p className="auth-form-box__subtitle">Confirm your email address to activate your account</p>
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

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="verify-otp" className="form-label">Enter OTP Code</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="verify-otp"
                      name="otp"
                      type="text"
                      maxLength="6"
                      className="form-input"
                      placeholder="6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={loading}
                      style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontFamily: 'var(--font-mono)', paddingLeft: '16px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg auth-submit-btn"
                  disabled={loading || !otp}
                >
                  {loading
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Verifying…</>
                    : <><i className="fa-light fa-sharp fa-shield-check" /> Verify & Login</>
                  }
                </button>
              </form>

              <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                Didn't receive the email?{' '}
                {timer > 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Resend code in {timer}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResend} 
                    disabled={resending}
                    style={{ 
                      background: 'none', border: 'none', color: 'var(--accent)', 
                      fontWeight: 600, cursor: 'pointer', padding: 0, 
                      textDecoration: 'underline' 
                    }}
                  >
                    {resending ? 'Resending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              <div className="auth-switch" style={{ marginTop: 'var(--space-4)' }}>
                Back to <Link to="/signin">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
