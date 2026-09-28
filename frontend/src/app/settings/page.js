'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import './settings.css';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { isOnline } = useChat();

  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (authLoading || !user) return null;

  return (
    <div className="settings-page">
      <header className="settings-header glass">
        <button className="settings-back" onClick={() => router.push('/home')} aria-label="Go back">
          ←
        </button>
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        {/* Language */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>🌐</span> Language
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Interface Language</div>
              <div className="settings-row-desc">Choose your preferred language for the UI</div>
            </div>
            <select
              className="settings-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              id="language-select"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>🎨</span> Appearance
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Dark Mode</div>
              <div className="settings-row-desc">Use the dark theme across the app</div>
            </div>
            <button
              className={`toggle ${darkMode ? 'active' : ''}`}
              onClick={() => setDarkMode(!darkMode)}
              role="switch"
              aria-checked={darkMode}
              id="dark-mode-toggle"
            />
          </div>
        </section>

        {/* Conversation */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>💬</span> Conversation
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Voice Input</div>
              <div className="settings-row-desc">Enable microphone for voice conversations</div>
            </div>
            <button
              className={`toggle ${voiceEnabled ? 'active' : ''}`}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              role="switch"
              aria-checked={voiceEnabled}
              id="voice-toggle"
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Auto-save Conversations</div>
              <div className="settings-row-desc">Automatically save conversation history</div>
            </div>
            <button
              className={`toggle ${autoSave ? 'active' : ''}`}
              onClick={() => setAutoSave(!autoSave)}
              role="switch"
              aria-checked={autoSave}
              id="autosave-toggle"
            />
          </div>
        </section>

        {/* Online / Offline */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>{isOnline ? '●' : '◎'}</span> Connection
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Status</div>
              <div className="settings-row-desc">{isOnline ? 'Connected to server' : 'You are offline'}</div>
            </div>
            <span style={{ fontSize: 'var(--font-size-sm)', color: isOnline ? '#69f0ae' : 'var(--text-muted)' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Prefer Offline Mode</div>
              <div className="settings-row-desc">Use local capabilities when available</div>
            </div>
            <button
              className={`toggle ${offlineMode ? 'active' : ''}`}
              onClick={() => setOfflineMode(!offlineMode)}
              role="switch"
              aria-checked={offlineMode}
              id="offline-toggle"
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>🔔</span> Notifications
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Push Notifications</div>
              <div className="settings-row-desc">Get notified about conversations</div>
            </div>
            <button
              className={`toggle ${notifications ? 'active' : ''}`}
              onClick={() => setNotifications(!notifications)}
              role="switch"
              aria-checked={notifications}
              id="notification-toggle"
            />
          </div>
        </section>

        {/* Privacy */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>🔒</span> Privacy
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Data Protection</div>
              <div className="settings-row-desc">Your conversations are encrypted and never shared with third parties</div>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="settings-section glass">
          <h2 className="settings-section-title">
            <span>👤</span> Account
          </h2>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">{user.name || 'User'}</div>
              <div className="settings-row-desc">{user.email}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Sign Out</div>
              <div className="settings-row-desc">Log out of your Talkie account</div>
            </div>
            <button className="settings-danger-btn" onClick={handleLogout} id="logout-btn">
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
