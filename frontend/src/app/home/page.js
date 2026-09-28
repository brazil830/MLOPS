'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePersona } from '@/context/PersonaContext';
import { useChat } from '@/context/ChatContext';
import { PERSONA_CATEGORIES } from '@/data/personasData';
import PersonaCard3D from '@/components/PersonaCard3D';
import NavigationDock from '@/components/NavigationDock';
import { Search, Sparkles, LogOut, Settings, Heart, Compass, MessageCircle, X } from 'lucide-react';
import './home.css';

export default function HomePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { personas, selectPersona } = usePersona();
  const { isOnline, clearChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeNavTab, setActiveNavTab] = useState('explore'); // explore, featured, recent
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Filter personas by Category, Search, and Nav Tab
  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      // Nav tab filters
      if (activeNavTab === 'featured') {
        // e.g. flagship personas
        if (!['mother', 'best_friend', 'romantic_partner', 'mentor', 'rival', 'crush'].includes(p.id)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRole = p.role.toLowerCase().includes(query);
        const matchesDesc = p.shortDesc.toLowerCase().includes(query);
        const matchesTags = p.tags?.some(t => t.toLowerCase().includes(query));
        return matchesName || matchesRole || matchesDesc || matchesTags;
      }

      return true;
    });
  }, [personas, selectedCategory, searchQuery, activeNavTab]);

  const handleSelectPersona = (personaId) => {
    clearChat();
    selectPersona(personaId);
    router.push(`/chat/${personaId}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (authLoading || !user) {
    return (
      <div className="home-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-spinner" style={{ width: 36, height: 36, borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#a855f7' }} />
      </div>
    );
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <div className="home-container">
      {/* Ambient background glow */}
      <div className="home-ambient-glow" />

      {/* TOP NAVIGATION HEADER */}
      <header className="home-nav-header" role="banner">
        <div className="home-nav-left">
          <div className="brand-identity" onClick={() => router.push('/home')}>
            <div className="brand-icon-wrap">
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="brand-title">Talkie</span>
              <span className="brand-badge">3D World</span>
            </div>
          </div>

          <nav className="nav-tab-links" aria-label="Main Navigation">
            <button
              className={`nav-tab-btn ${activeNavTab === 'explore' ? 'active' : ''}`}
              onClick={() => setActiveNavTab('explore')}
            >
              Explore
            </button>
            <button
              className={`nav-tab-btn ${activeNavTab === 'featured' ? 'active' : ''}`}
              onClick={() => setActiveNavTab('featured')}
            >
              Featured
            </button>
            <button
              className={`nav-tab-btn ${activeNavTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveNavTab('recent')}
            >
              Recent
            </button>
          </nav>
        </div>

        {/* Center Search Bar */}
        <div className="home-nav-center">
          <div className="search-bar-wrap">
            <Search className="search-icon" size={17} />
            <input
              type="text"
              className="search-input"
              placeholder="Search companion by name, role, or vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search personas"
              id="persona-search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="home-nav-right">
          <div className="nav-online-status" aria-live="polite">
            <span className={`status-indicator-dot ${isOnline ? '' : 'offline'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* User profile dropdown button */}
          <div style={{ position: 'relative' }}>
            <button
              className="user-avatar-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              aria-label="User account menu"
              aria-expanded={showUserDropdown}
              id="user-profile-menu-toggle"
            >
              {userInitial}
            </button>

            {showUserDropdown && (
              <div className="user-profile-dropdown" role="menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-name">{user.name || 'Talkie Explorer'}</div>
                  <div className="dropdown-user-email">{user.email}</div>
                </div>

                <button
                  className="dropdown-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push('/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <button
                  className="dropdown-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowUserDropdown(false);
                    router.push('/');
                  }}
                >
                  <Compass size={16} />
                  <span>Landing World</span>
                </button>

                <button
                  className="dropdown-menu-item danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO DISCOVERY SECTION */}
      <section className="home-hero-banner">
        <div className="hero-subhead-pill">
          <Sparkles size={14} />
          <span>Interactive 3D Companions</span>
        </div>

        <h1 className="hero-main-title">
          Find someone to <span className="gradient-text">talk to</span>,<br />
          whenever you need them.
        </h1>

        <p className="hero-description">
          Step inside the world of intelligent, emotionally-responsive companions.
          Each character brings their own memories, emotional depth, and living presence.
        </p>

        {/* Category Pills */}
        <div className="category-filter-bar" role="tablist" aria-label="Persona categories">
          {PERSONA_CATEGORIES.map((cat) => {
            const count = cat.id === 'all'
              ? personas.length
              : personas.filter(p => p.category === cat.id).length;

            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`category-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="category-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search results status if filtering */}
      {searchQuery && (
        <div className="search-results-info">
          <span>Found {filteredPersonas.length} companions matching &ldquo;{searchQuery}&rdquo;</span>
          <button className="search-clear-inline" onClick={() => setSearchQuery('')}>
            Show all
          </button>
        </div>
      )}

      {/* ASYMMETRIC MASONRY PERSONA GRID */}
      <main className="personas-masonry-wrapper" aria-label="Persona Marketplace">
        {filteredPersonas.length > 0 ? (
          <div className="personas-masonry-grid">
            {filteredPersonas.map((persona, index) => (
              <PersonaCard3D
                key={persona.id}
                persona={persona}
                onSelect={handleSelectPersona}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="personas-empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No companions found</h3>
            <p>Try searching with another word or browse all categories.</p>
            <button
              className="category-pill-btn active"
              style={{ marginTop: 16 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Dock for Mobile/Tablet */}
      <NavigationDock
        activeTab={activeNavTab}
        onTabChange={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'explore') setSelectedCategory('all');
        }}
      />
    </div>
  );
}
