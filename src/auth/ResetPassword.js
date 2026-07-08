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
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel__grid" />
        <div className="auth-panel__content">
          <div className="auth-panel__logo">
            HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
          </div>
          <div className="auth-panel__tagline">
            <h2>Nepal's technology access center.</h2>
            <p>Access your user portal, request custom 3D prints, design digital systems, and track your projects.</p>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-wrap">
        <div className="auth-form-box">
          <div className="auth-form-box__header">
            <div className="auth-form-box__eyebrow">Secure Account</div>
            <h1 className="auth-form-box__title">Create New Password</h1>
            <p className="auth-form-box__subtitle">Enter your new secure password below</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
              <i className="fa-light fa-sharp fa-circle-exclamation" />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert" style={{ marginBottom: 'var(--space-5)', color: '#4caf50', borderColor: 'rgba(76, 175, 80, 0.2)', backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
              <i className="fa-light fa-sharp fa-circle-check" style={{ marginRight: '8px' }} />
              {success}
            </div>
          )}

          {!success && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* New Password */}
              <div className="form-group">
                <label htmlFor="reset-password-input" className="form-label">
                  <i className="fa-light fa-sharp fa-lock" /> New Password
                </label>
                <input
                  id="reset-password-input"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="reset-confirm-password" className="form-label">
                  <i className="fa-light fa-sharp fa-lock" /> Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
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
      </main>
    </div>
  );
}
