'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, MessageCircle, Heart } from 'lucide-react';

export default function PersonaCard3D({ persona, onSelect, index = 0 }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease',
  });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Gentle, restrained tilt
    const rotX = -y * 12;
    const rotY = x * 12;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`,
      transition: 'transform 0.08s ease-out, box-shadow 0.2s ease',
    });

    setGlarePos({
      x: ((x + 0.5) * 100).toFixed(1),
      y: ((y + 0.5) * 100).toFixed(1),
      opacity: 0.25,
    });

    // Parallax depth shift on the image
    setImgOffset({
      x: -x * 14,
      y: -y * 14,
    });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
    });
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
    setImgOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`persona-3d-card persona-span-${persona.cardSpan || 'regular'}`}
      style={{
        ...style,
        '--card-accent': persona.color || '#a855f7',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(persona.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(persona.id);
        }
      }}
      aria-label={`Enter conversation with ${persona.name}, your ${persona.role}`}
      id={`persona-card-${persona.id}`}
    >
      {/* Dynamic Cursor Spotlight / Glare Layer */}
      <div
        className="card-spotlight"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity}), transparent 60%)`,
        }}
      />

      {/* Outer Border Glow */}
      <div className={`card-border-glow ${isHovered ? 'active' : ''}`} />

      {/* Image Container with 3D Parallax */}
      <div className="card-image-wrapper">
        {/* Placeholder Gradient Backdrop */}
        <div
          className="card-image-fallback"
          style={{ background: persona.gradient }}
        >
          <span className="card-fallback-avatar">{persona.avatar}</span>
        </div>

        {/* AI-Generated Persona Portrait */}
        <img
          src={persona.image}
          alt={persona.name}
          className={`card-persona-img ${imgLoaded ? 'loaded' : ''}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(false)}
          style={{
            transform: `translate3d(${imgOffset.x}px, ${imgOffset.y}px, 0px) scale(${isHovered ? 1.08 : 1.03})`,
          }}
        />

        {/* Cinematic Scrim & Depth Gradient Overlays */}
        <div className="card-scrim-top" />
        <div className="card-scrim-bottom" />
      </div>

      {/* Floating Top Badges */}
      <div className="card-top-badges">
        <span className="card-role-pill">
          <span className="role-icon">{persona.avatar}</span>
          <span className="role-text">{persona.role}</span>
        </span>

        <span className="card-status-pill">
          <span className="status-indicator-dot" />
          <span className="status-text">Online</span>
        </span>
      </div>

      {/* Foreground Content (Pops in Z-Space) */}
      <div className="card-foreground-content">
        <div className="card-title-row">
          <h3 className="card-persona-name">{persona.name}</h3>
          <span className="card-quick-role">{persona.role}</span>
        </div>

        <p className="card-persona-desc">{persona.shortDesc}</p>

        {persona.tags && persona.tags.length > 0 && (
          <div className="card-tags-row">
            {persona.tags.slice(0, 2).map((tag, tIdx) => (
              <span key={tIdx} className="card-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Hover Enter World Action Pill */}
        <div className="card-enter-action">
          <span className="enter-text">Enter World</span>
          <span className="enter-arrow">→</span>
        </div>
      </div>
    </div>
  );
}
