'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Sparkles, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import AuthVisualPanel from '../AuthVisualPanel';
import '../auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to send reset email');
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Panel */}
      <AuthVisualPanel />

      {/* Right Panel */}
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
              <h1 className="auth-title">
                {sent ? 'Check your inbox' : 'Reset password'}
              </h1>
              <p className="auth-subtitle">
                {sent
                  ? 'We have dispatched recovery instructions to your email address.'
                  : 'Enter your email address to receive account recovery instructions.'}
              </p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {!sent ? (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label htmlFor="forgot-email">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      id="forgot-email"
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

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading}
                  id="forgot-submit"
                >
                  {loading ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(103, 232, 249, 0.1)',
                    border: '1px solid rgba(103, 232, 249, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#67E8F9',
                  }}
                >
                  <Mail size={26} />
                </div>
                <p style={{ color: '#B8AECF', fontSize: '13px', lineHeight: 1.6 }}>
                  If an account exists for <strong style={{ color: '#F8FAFC' }}>{email}</strong>, you will receive a secure password reset link shortly.
                </p>
              </div>
            )}

            <p className="auth-footer" style={{ marginTop: '24px' }}>
              <Link
                href="/auth/login"
                className="auth-footer-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={15} />
                <span>Back to Sign In</span>
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
