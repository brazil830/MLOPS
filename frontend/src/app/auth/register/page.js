'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import AuthVisualPanel from '../AuthVisualPanel';
import '../auth.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Compute password strength score (0 to 4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', class: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', class: 'weak' };
      case 2:
        return { score: 2, label: 'Fair', class: 'fair' };
      case 3:
        return { score: 3, label: 'Good', class: 'good' };
      case 4:
        return { score: 4, label: 'Strong', class: 'strong' };
      default:
        return { score: 0, label: '', class: '' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Panel: Immersive Visual & Companion Artwork */}
      <AuthVisualPanel />

      {/* Right Panel: Registration Form */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          
          {/* Mobile Header */}
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
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">
                Begin meaningful conversations with your AI companion.
              </p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
              <div className="input-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="input-wrapper">
                  <input
                    id="reg-name"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="reg-email"
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
                <label htmlFor="reg-password">Password</label>
                <div className="input-wrapper has-toggle">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

                {password.length > 0 && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={`strength-bar ${
                            index <= strength.score ? `active-${strength.class}` : ''
                          }`}
                        />
                      ))}
                    </div>
                    <div className="strength-label">
                      <span>Password strength</span>
                      <span className={`strength-label-text ${strength.class}`}>
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-wrapper has-toggle">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    tabIndex={0}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={loading}
                id="register-submit"
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?
              <Link href="/auth/login" className="auth-footer-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
