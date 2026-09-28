'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Compass, Sparkles, MessageSquare, Brain, Settings, User } from 'lucide-react';

export default function NavigationDock({ activeTab, onTabChange }) {
  const pathname = usePathname();
  const router = useRouter();

  const isChat = pathname?.startsWith('/chat');

  if (isChat) return null; // Chat page has its own minimal floating controls

  return (
    <nav className="floating-bottom-dock" aria-label="Mobile Navigation">
      <div className="dock-glass-inner">
        <button
          className={`dock-item ${activeTab === 'explore' || pathname === '/home' ? 'active' : ''}`}
          onClick={() => {
            if (pathname !== '/home') router.push('/home');
            onTabChange?.('explore');
          }}
          aria-label="Explore Personas"
        >
          <Compass className="dock-icon" size={20} />
          <span className="dock-label">Explore</span>
        </button>

        <button
          className={`dock-item ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => {
            if (pathname !== '/home') router.push('/home');
            onTabChange?.('featured');
          }}
          aria-label="Featured Characters"
        >
          <Sparkles className="dock-icon" size={20} />
          <span className="dock-label">Featured</span>
        </button>

        <button
          className={`dock-item ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => {
            if (pathname !== '/home') router.push('/home');
            onTabChange?.('recent');
          }}
          aria-label="Recent Conversations"
        >
          <MessageSquare className="dock-icon" size={20} />
          <span className="dock-label">Recent</span>
        </button>

        <button
          className={`dock-item ${pathname === '/settings' ? 'active' : ''}`}
          onClick={() => router.push('/settings')}
          aria-label="Settings"
        >
          <Settings className="dock-icon" size={20} />
          <span className="dock-label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
