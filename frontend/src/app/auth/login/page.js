'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import AuthVisualPanel from '../AuthVisualPanel';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/home');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Panel: Immersive Visual & Companion Artwork */}
      <AuthVisualPanel />

      {/* Right Panel: Authentication Form */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          
          {/* Mobile Header (displayed on mobile devices) */}
          <div className="auth-mobile-header">
            <Link href="/" className="auth-mobile-logo-group">
              <span className="auth-mobile-logo">Talkie</span>
              <span className="auth-visual-badge">
                <Sparkles size={11} className="auth-badge-icon" />
                <span>3D World</span>
              </span>
            </Link>
            <div className="auth-mobile-avatar-orb">
              <img
                src="/auth_companion.jpg"
                alt="Talkie AI Companion"
                className="auth-mobile-avatar-img"
              />
            </div>
          </div>

          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Your companion is waiting for you.</p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
              <div className="input-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="login-email"
                    type="email"
                    className="input-field"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-label-row">
                  <label htmlFor="login-password">Password</label>
                  <Link href="/auth/forgot" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-wrapper has-toggle">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading}
                id="login-submit"
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              New to Talkie?
              <Link href="/auth/register" className="auth-footer-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
