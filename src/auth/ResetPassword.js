import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Password reset token is missing. Please check your reset email.');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      setSuccess('Your password has been successfully reset! Redirecting to Sign In...');
      setTimeout(() => {
        navigate('/signin', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          </div>
          <div className="auth-panel__tagline">
            <h2>Nepal's technology access center.</h2>
            <p>Access your user portal, request custom 3D prints, design digital systems, and track your projects.</p>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-form-box">
            <div className="auth-fade-in">
              <div className="auth-form-box__header">
                <div className="auth-form-box__eyebrow">Secure Account</div>
                <h1 className="auth-form-box__title">Create New Password</h1>
                <p className="auth-form-box__subtitle">Enter your new secure password below</p>
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

              {!success && (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                  {/* New Password */}
                  <div className="form-group">
                    <label htmlFor="reset-password-input" className="form-label">New Password</label>
                    <div className="auth-input-wrapper auth-input-wrapper--password">
                      <input
                        id="reset-password-input"
                        type={showPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label htmlFor="reset-confirm-password" className="form-label">Confirm Password</label>
                    <div className="auth-input-wrapper auth-input-wrapper--password">
                      <input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <i className="fa-light fa-sharp fa-lock auth-input-icon" />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        tabIndex="-1"
                      >
                        <i className={`fa-light fa-sharp fa-eye${showConfirmPassword ? '-slash' : ''}`} />
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
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Resetting…</>
                      : <><i className="fa-light fa-sharp fa-check" /> Update Password</>
                    }
                  </button>
                </form>
              )}

              <div className="auth-switch">
                Remembered your password? <Link to="/signin">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
