'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LandingScene from './LandingScene';
import './landing.css';

export default function RootPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(false);
  const [emotion, setEmotion] = useState('calm');
  const [hoveredCta, setHoveredCta] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowLanding(true);
    }
  }, [loading]);

  if (!showLanding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f051e' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleCtaEnter = () => { setHoveredCta(true); };
  const handleCtaLeave = () => { setHoveredCta(false); };
  const handleLinkEnter = () => {};
  const handleLinkLeave = () => {};

  return (
    <div className="landing-wrapper">
      <div className="canvas-container">
        <LandingScene 
          emotion={emotion} 
          hoveredCta={hoveredCta} 
        />
      </div>
      
      <div className="landing-content">
        <nav className="landing-nav">
          <div className="landing-logo-group">
             <span className="landing-logo">Talkie</span>
             <span className="landing-world-pill">3D World</span>
          </div>
          <div className="landing-nav-links">
             {user ? (
               <>
                 <Link href="/home" className="btn-secondary" onMouseEnter={handleLinkEnter} onMouseLeave={handleLinkLeave}>Go to App</Link>
                 <button onClick={logout} className="btn-primary" onMouseEnter={handleCtaEnter} onMouseLeave={handleCtaLeave} style={{ cursor: 'pointer', border: 'none' }}>Sign Out</button>
               </>
             ) : (
               <>
                 <Link href="/auth/login" className="btn-secondary" onMouseEnter={handleLinkEnter} onMouseLeave={handleLinkLeave}>Sign In</Link>
                 <Link href="/auth/register" className="btn-primary" onMouseEnter={handleCtaEnter} onMouseLeave={handleCtaLeave}>Enter World <ArrowRight size={16}/></Link>
               </>
             )}
          </div>
        </nav>
        
        <section className="landing-section section-hero">
            <div className="desktop-grid">
              <div className="text-block">
                 <h1 className="hero-title">Your AI companions,<br/>brought to life.</h1>
                 <p className="hero-subtitle">Step into an immersive world of AI companions with presence, emotion and memory.</p>
                 <div className="hero-actions">
                     <Link href={user ? "/home" : "/auth/register"} className="btn-primary" onMouseEnter={handleCtaEnter} onMouseLeave={handleCtaLeave}>
                        {user ? "Go to Dashboard" : "Enter the World"} <ArrowRight size={18} />
                     </Link>
                     <Link href={user ? "/home" : "/auth/login"} className="btn-secondary" onMouseEnter={handleLinkEnter} onMouseLeave={handleLinkLeave}>
                        {user ? "Explore Personas" : "Explore How It Works"}
                     </Link>
                 </div>
              </div>
              <div className="hero-image-container">
                 <img 
                   src="/ai_companion_aurora.jpg" 
                   alt="AI Companion" 
                   style={{ 
                     width: '100%', 
                     borderRadius: '24px',
                     maskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
                     WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
                     boxShadow: '0 0 50px rgba(168, 85, 247, 0.4)'
                   }} 
                 />
              </div>
            </div>
        </section>
        
        <section className="landing-section">
            <div className="presence-grid">
              <div className="presence-image-wrapper">
                 <img 
                   src="/live_conversation_preview_aurora.jpg" 
                   alt="Live Conversation Preview" 
                   style={{ 
                     width: '100%', 
                     borderRadius: '24px',
                     maskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
                     WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 100%)',
                     boxShadow: '0 0 50px rgba(168, 85, 247, 0.4)'
                   }} 
                 />
              </div>
              <div className="presence-content">
                 <div className="text-block">
                    <h2 className="section-title">Presence</h2>
                    <p className="section-desc">Your companion isn't trapped inside a chat box. Experience a living entity that breathes, reacts, and occupies real spatial depth in your browser.</p>
                 </div>
              </div>
            </div>
        </section>

        <section className="landing-section section-emotion">
            <div className="emotion-bg"></div>
            <div className="desktop-grid emotion-content">
              <div className="text-block">
                 <h2 className="section-title">Emotion</h2>
                 <p className="section-desc">An atmosphere that syncs with every feeling. The entire visual environment adapts organically to the state of your conversation.</p>
                 <div className="emotion-controls">
                    {['calm', 'joy', 'curious', 'intimate'].map(e => (
                       <button 
                         key={e} 
                         className={`emotion-btn ${emotion === e ? 'active' : ''}`} 
                         onClick={() => setEmotion(e)}
                         onMouseEnter={handleLinkEnter} 
                         onMouseLeave={handleLinkLeave}
                       >
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                       </button>
                    ))}
                 </div>
              </div>
              <div>{/* Empty space for planet */}</div>
            </div>
        </section>

        <section className="landing-section">
             <div className="text-block center">
               <h2 className="section-title">Memory Constellation</h2>
               <p className="section-desc">Every meaningful interaction becomes a lasting part of your shared universe. Hover through the constellation to reveal scattered fragments of past conversations.</p>
            </div>
        </section>

        <section className="landing-section section-cta">
            <div className="text-block center">
                <h1 className="hero-title">Your world is waiting.</h1>
                <p className="hero-subtitle" style={{margin: '0 auto 40px auto'}}>Meet the companions who remember, respond and evolve with you.</p>
                <Link href={user ? "/home" : "/auth/register"} className="btn-primary cta-large" style={{fontSize: '1.2rem', padding: '16px 36px'}} onMouseEnter={handleCtaEnter} onMouseLeave={handleCtaLeave}>
                   {user ? "Go to Dashboard" : "Enter the World"} <ArrowRight size={22} />
                </Link>
            </div>
        </section>
        
        <footer className="landing-footer">
           <p>Talkie © 2026. Designed as a living world.</p>
        </footer>
      </div>
    </div>
  );
}
