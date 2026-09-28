'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthVisualPanel() {
  return (
    <div className="auth-visual-panel" aria-hidden="false">
      {/* Ambient background glows */}
      <div className="auth-visual-glow auth-visual-glow-top" />
      <div className="auth-visual-glow auth-visual-glow-bottom" />
      
      {/* Subtle floating particles in space */}
      <div className="auth-particles">
        <span className="particle particle-1" />
        <span className="particle particle-2" />
        <span className="particle particle-3" />
        <span className="particle particle-4" />
        <span className="particle particle-5" />
        <span className="particle particle-6" />
      </div>

      {/* Top Header with Brand */}
      <div className="auth-visual-header">
        <Link href="/" className="auth-visual-logo-link" title="Return to Talkie Home">
          <div className="auth-visual-logo-group">
            <span className="auth-visual-logo-text">Talkie</span>
            <span className="auth-visual-badge">
              <Sparkles size={12} className="auth-badge-icon" />
              <span>3D World</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Centerpiece Visual */}
      <div className="auth-visual-body">
        <div className="auth-character-wrapper">
          <div className="auth-character-halo" />
          <div className="auth-character-frame">
            <img
              src="/auth_companion.jpg"
              alt="Talkie AI Companion in 3D Space"
              className="auth-character-image"
              loading="eager"
            />
            <div className="auth-character-overlay" />
          </div>

          {/* Floating status pill */}
          <div className="auth-floating-chip">
            <span className="status-indicator-dot" />
            <span className="floating-chip-text">AI Companion Active & Ready</span>
          </div>
        </div>

        {/* Narrative Headings */}
        <div className="auth-visual-copy">
          <h2 className="auth-visual-headline">
            A world that understands you.
          </h2>
          <p className="auth-visual-subtext">
            Meet your AI companion. Share your thoughts, explore your emotions, and build meaningful connections in an immersive 3D world.
          </p>
        </div>
      </div>

      {/* Bottom Footer / Tagline */}
      <div className="auth-visual-footer">
        <p className="auth-visual-caption">
          Your space. Your companion. Your story.
        </p>
      </div>
    </div>
  );
}
