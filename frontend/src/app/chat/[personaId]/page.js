'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePersona } from '@/context/PersonaContext';
import { useChat } from '@/context/ChatContext';
import { EMOTION_ATMOSPHERES } from '@/data/personasData';
import { speakPersonaMessage, stopSpeech } from '@/utils/voiceEngine';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Brain,
  Volume2,
  VolumeX,
  X,
  Play,
  RotateCcw
} from 'lucide-react';
import '../chat.css';

/* Emotion mapping helper for GoEmotions classes to 8 visual states */
const EMOTION_MAP = {
  admiration: 'happy', amusement: 'playful', anger: 'angry', annoyance: 'angry',
  approval: 'happy', caring: 'caring', confusion: 'neutral', curiosity: 'neutral',
  desire: 'romantic', disappointment: 'sad', disapproval: 'serious', disgust: 'angry',
  embarrassment: 'sad', excitement: 'playful', fear: 'sad', gratitude: 'happy',
  grief: 'sad', joy: 'happy', love: 'romantic', nervousness: 'sad',
  optimism: 'happy', pride: 'happy', realization: 'serious', relief: 'caring',
  remorse: 'sad', sadness: 'sad', surprise: 'playful', neutral: 'neutral',
};

const EMOTION_EMOJIS = {
  happy: '😊', sad: '🥺', caring: '🤗', playful: '😉',
  serious: '🤔', romantic: '💕', angry: '😤', neutral: '😌',
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const personaId = params.personaId;

  const { user, token, loading: authLoading } = useAuth();
  const {
    personas,
    selectedPersona,
    selectPersona,
    emotionState,
    setEmotionState,
  } = usePersona();

  const {
    messages,
    isTyping,
    isOnline,
    memories,
    sendMessage,
    loadHistory,
    loadMemories,
    clearChat,
  } = useChat();

  const [input, setInput] = useState('');
  const [showMemory, setShowMemory] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [sending, setSending] = useState(false);

  // Voice Response State
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState(null);

  // Parallax & smooth 3D stage tracking
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Persona multi-state image crossfade buffer
  const [currentImg, setCurrentImg] = useState('');
  const [incomingImg, setIncomingImg] = useState('');
  const [isCrossfading, setIsCrossfading] = useState(false);

  const messageEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Select persona on mount
  useEffect(() => {
    if (personaId) {
      selectPersona(personaId);
    }
  }, [personaId, selectPersona]);

  // Load chat history & relationship memories
  useEffect(() => {
    if (personaId && token) {
      loadHistory(personaId, token);
      loadMemories(personaId, token);
    }
  }, [personaId, token, loadHistory, loadMemories]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const persona = useMemo(() => {
    return selectedPersona || personas.find(p => p.id === personaId) || null;
  }, [selectedPersona, personas, personaId]);

  // Get active atmosphere based on current emotion
  const atmosphere = useMemo(() => {
    return EMOTION_ATMOSPHERES[emotionState] || EMOTION_ATMOSPHERES.neutral;
  }, [emotionState]);

  // Resolve target persona image based on current emotion state
  const targetImage = useMemo(() => {
    if (!persona) return '';
    if (persona.emotionImages && persona.emotionImages[emotionState]) {
      return persona.emotionImages[emotionState];
    }
    return persona.image;
  }, [persona, emotionState]);

  // Seamless crossfade handler when target image changes (or immediate sync on persona switch)
  useEffect(() => {
    if (!targetImage) return;
    if (!currentImg || incomingImg) {
      setCurrentImg(targetImage);
      setIncomingImg('');
      setIsCrossfading(false);
      return;
    }
    if (targetImage !== currentImg) {
      setIncomingImg(targetImage);
      setIsCrossfading(true);
      const timer = setTimeout(() => {
        setCurrentImg(targetImage);
        setIsCrossfading(false);
        setIncomingImg('');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [targetImage, personaId]);

  // Handle playing persona voice for a specific message
  const handlePlayVoice = useCallback((text, msgId) => {
    if (!text) return;
    if (isSpeaking && activeSpeakingMsgId === msgId) {
      stopSpeech();
      setIsSpeaking(false);
      setActiveSpeakingMsgId(null);
      return;
    }

    setActiveSpeakingMsgId(msgId);
    setIsSpeaking(true);

    speakPersonaMessage(
      text,
      personaId,
      () => {
        setIsSpeaking(true);
        setActiveSpeakingMsgId(msgId);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      }
    );
  }, [personaId, isSpeaking, activeSpeakingMsgId]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Parallax tracking on cursor movement
  const handleStageMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMouseOffset({ x: x * 8, y: y * 6 });
  }, []);

  // Send message
  const handleSend = useCallback(async (customText) => {
    const textToSend = (typeof customText === 'string' ? customText : input).trim();
    if (!textToSend || sending) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);

    try {
      const data = await sendMessage(textToSend, personaId, token);
      
      // Synchronize emotion state from response
      if (data && data.emotion) {
        const mapped = EMOTION_MAP[data.emotion] || data.emotion || 'neutral';
        setEmotionState(mapped);
      }

      // Automatically speak the persona response with voice audio
      if (data && data.response && voiceAudioEnabled) {
        const respMsgId = Date.now().toString();
        handlePlayVoice(data.response, respMsgId);
      }
    } catch {
      // Error handled in ChatContext
    } finally {
      setSending(false);
    }
  }, [input, sending, personaId, token, sendMessage, setEmotionState, voiceAudioEnabled, handlePlayVoice]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    stopSpeech();
    clearChat();
    router.push('/home');
  };

  if (authLoading || !user) {
    return (
      <div className="chat-world-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-spinner" style={{ width: 36, height: 36, borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#a855f7' }} />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="chat-world-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)' }}>Companion not found.</p>
        <button className="header-action-btn" onClick={() => router.push('/home')}>
          Return to Explore
        </button>
      </div>
    );
  }

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="chat-world-viewport"
      onMouseMove={handleStageMouseMove}
      style={{
        '--emotion-glow': atmosphere.glowColor,
        '--emotion-accent': atmosphere.accentColor,
        '--header-accent': persona.color || atmosphere.accentColor,
        '--header-glow': atmosphere.glowColor,
      }}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="chat-offline-ribbon" role="status">
          <span>◎ Offline Mode</span>
          <span>•</span>
          <span>Local memory active</span>
        </div>
      )}

      {/* ---------- 1. FULL VIEWPORT AI PERSONA STAGE ---------- */}
      <div className="persona-environment-stage" aria-hidden="true">
        {/* Ambient Emotion Atmosphere Gradient */}
        <div
          className="emotion-ambient-aura"
          style={{ background: atmosphere.bgGradient }}
        />

        {/* Ambient Background Aura Layer */}
        <div className="persona-backdrop-ambient">
          {currentImg && (
            <img src={currentImg} alt="" />
          )}
        </div>

        {/* Dual-buffer Persona Image Stage with Natural Bust Framing (Head till Chest) */}
        <div className="persona-image-stage">
          {currentImg && (
            <img
              src={currentImg}
              alt={persona.name}
              className="persona-presence-img current"
              onError={(e) => {
                if (e.currentTarget.src !== persona.image) {
                  e.currentTarget.src = persona.image;
                }
              }}
              style={{
                transform: `translate3d(${-mouseOffset.x}px, ${-mouseOffset.y}px, 0) scale(1.0)`,
                filter: atmosphere.filterEffect,
              }}
            />
          )}

          {incomingImg && (
            <img
              src={incomingImg}
              alt={persona.name}
              className={`persona-presence-img incoming ${isCrossfading ? 'active' : ''}`}
              onError={(e) => {
                if (e.currentTarget.src !== persona.image) {
                  e.currentTarget.src = persona.image;
                }
              }}
              style={{
                transform: `translate3d(${-mouseOffset.x}px, ${-mouseOffset.y}px, 0) scale(1.0)`,
                filter: atmosphere.filterEffect,
              }}
            />
          )}
        </div>

        {/* Atmospheric Vignette & Scrims for Text Readability */}
        <div className="stage-scrim-top" />
        <div className="stage-scrim-bottom" />
        <div className="stage-vignette" />
      </div>

      {/* ---------- 2. FLOATING MINIMAL HEADER ---------- */}
      <header className="floating-chat-header" role="banner">
        {/* Left: Persona Identity Capsule */}
        <div className="header-glass-capsule">
          <button
            className="header-back-btn"
            onClick={handleBack}
            aria-label="Exit conversation to marketplace"
            id="chat-back-btn"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="header-persona-identity"
            onClick={() => setShowMemory(true)}
            title="View relationship memory"
          >
            <div className="header-avatar-thumb">
              <img
                src={persona.image}
                alt={persona.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="header-meta">
              <div className="header-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{persona.name}</span>
                {isSpeaking && (
                  <div className="speaking-wave-mini" title={`${persona.name} is speaking`}>
                    <span className="speaking-wave-bar" />
                    <span className="speaking-wave-bar" />
                    <span className="speaking-wave-bar" />
                    <span className="speaking-wave-bar" />
                  </div>
                )}
              </div>
              <div className="header-role-status">
                <span className="header-role">{persona.role}</span>
                <span>•</span>
                <span className={`header-status-dot ${isOnline ? '' : 'offline'}`} />
                <span>{isSpeaking ? 'Speaking...' : (isOnline ? 'Online' : 'Offline')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Floating Action Pills */}
        <div className="header-actions-capsule">
          {/* Voice Audio Toggle Button */}
          <button
            className={`voice-audio-pill ${voiceAudioEnabled ? 'active' : 'muted'}`}
            onClick={() => {
              if (voiceAudioEnabled) {
                stopSpeech();
                setIsSpeaking(false);
                setActiveSpeakingMsgId(null);
              }
              setVoiceAudioEnabled(!voiceAudioEnabled);
            }}
            aria-label={voiceAudioEnabled ? 'Mute Persona Voice' : 'Enable Persona Voice'}
            title={voiceAudioEnabled ? 'Persona Voice is ON (Click to mute)' : 'Persona Voice is Muted (Click to enable)'}
            id="chat-voice-audio-toggle"
          >
            {voiceAudioEnabled ? <Volume2 size={16} color="#c084fc" /> : <VolumeX size={16} color="#94a3b8" />}
            <span>{voiceAudioEnabled ? 'Voice ON' : 'Voice Muted'}</span>
          </button>

          {/* Emotion Showcase Pill */}
          <button
            className="emotion-badge-pill"
            onClick={() => setShowEmotionPicker(!showEmotionPicker)}
            aria-label="Change persona emotional state"
            id="chat-emotion-toggle"
          >
            <span>{EMOTION_EMOJIS[emotionState] || '😌'}</span>
            <span style={{ textTransform: 'capitalize' }}>{atmosphere.label}</span>
          </button>

          {/* Voice Space Mode Toggle */}
          <button
            className={`header-action-btn ${voiceModeActive ? 'active' : ''}`}
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            aria-label="Toggle Voice Space"
            id="chat-voice-mode-toggle"
          >
            <Mic size={16} />
            <span className="btn-text">Live Space</span>
          </button>

          {/* Relationship Memories Drawer Toggle */}
          <button
            className={`header-action-btn ${showMemory ? 'active' : ''}`}
            onClick={() => setShowMemory(!showMemory)}
            aria-label="Things we remember"
            id="chat-memory-drawer-toggle"
          >
            <Brain size={16} />
            <span className="btn-text">Memories</span>
          </button>
        </div>

        {/* Emotion Switcher Popover */}
        {showEmotionPicker && (
          <div className="emotion-picker-dropdown" role="dialog" aria-label="Visual emotion states">
            <div className="emotion-picker-header">
              <span>Persona Emotional Presence</span>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowEmotionPicker(false)}
              >
                ✕
              </button>
            </div>
            <div className="emotion-picker-grid">
              {Object.keys(EMOTION_ATMOSPHERES).map((stateKey) => (
                <button
                  key={stateKey}
                  className={`emotion-picker-item ${emotionState === stateKey ? 'active' : ''}`}
                  onClick={() => {
                    setEmotionState(stateKey);
                    setShowEmotionPicker(false);
                  }}
                >
                  <span>{EMOTION_EMOJIS[stateKey]}</span>
                  <span style={{ textTransform: 'capitalize' }}>{stateKey}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ---------- 3. FLOATING CONVERSATIONAL MESSAGE OVERLAY ---------- */}
      <main className="floating-conversation-stage" aria-label="Conversation Scene">
        <div className="floating-messages-scroll" role="log" aria-live="polite">
          {/* Floating Messages List */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`floating-msg ${msg.role === 'user' ? 'user' : 'persona'}`}
              style={{
                '--msg-accent': atmosphere.accentColor,
              }}
            >
              <div className="msg-glass-body">
                {msg.content}
              </div>
              <div className="msg-meta-row">
                <span className="msg-timestamp">{formatTime(msg.timestamp)}</span>
                {msg.role === 'persona' && (
                  <button
                    className={`msg-voice-btn ${activeSpeakingMsgId === msg.id ? 'speaking' : ''}`}
                    onClick={() => handlePlayVoice(msg.content, msg.id)}
                    title="Play voice audio"
                    aria-label="Play message audio"
                  >
                    <Volume2 size={13} />
                    <span>{activeSpeakingMsgId === msg.id ? 'Playing...' : 'Voice'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Persona Thinking / Processing Floating State */}
          {(isTyping || sending) && (
            <div className="persona-thinking-bubble">
              <div className="thinking-avatar-pulse">
                <span>{persona.avatar}</span>
              </div>
              <span className="thinking-label">{persona.name} is responding...</span>
              <div className="typing-wave-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>
      </main>

      {/* Quick Prompt Starter Chips */}
      {messages.length < 4 && persona.promptStarters && persona.promptStarters.length > 0 && (
        <div className="convo-starter-chips-wrap" aria-label="Conversation starters">
          {persona.promptStarters.map((starter, sIdx) => (
            <button
              key={sIdx}
              className="starter-chip"
              onClick={() => handleSend(starter)}
              disabled={sending}
            >
              💬 {starter}
            </button>
          ))}
        </div>
      )}

      {/* ---------- 4. FLOATING BOTTOM COMPOSER DOCK ---------- */}
      <footer className="floating-composer-dock" role="contentinfo">
        <div className="composer-glass-shell">
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={`Message ${persona.name}...`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label={`Message ${persona.name}`}
            id="floating-message-input"
            disabled={sending}
          />

          <button
            className="composer-action-btn"
            onClick={() => setVoiceModeActive(true)}
            aria-label="Activate voice space"
            title="Voice space"
          >
            <Mic size={18} />
          </button>

          <button
            className="composer-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            aria-label="Send message"
            id="floating-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>

      {/* ---------- 5. IMMERSIVE VOICE SPACE OVERLAY ---------- */}
      {voiceModeActive && (
        <div className="voice-space-modal-overlay" role="dialog" aria-label="Voice conversation space">
          <div className="voice-space-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Volume2 size={22} color="#c084fc" />
              <span className="voice-space-title">Voice Space with {persona.name}</span>
            </div>
            <button
              className="voice-space-close-btn"
              onClick={() => {
                stopSpeech();
                setVoiceModeActive(false);
              }}
              aria-label="Close voice space"
            >
              <X size={20} />
            </button>
          </div>

          <div className="voice-space-center-stage">
            <div className="voice-persona-orb-wrap">
              <div className="voice-pulse-ring" />
              <div className="voice-persona-orb">
                <img
                  src={currentImg || persona.image}
                  alt={persona.name}
                  onError={(e) => {
                    if (e.currentTarget.src !== persona.image) {
                      e.currentTarget.src = persona.image;
                    }
                  }}
                />
              </div>
            </div>

            <div className="voice-status-text">
              {isSpeaking ? `${persona.name} is speaking...` : (isTyping ? `${persona.name} is reflecting...` : (voiceMuted ? 'Microphone Muted' : 'Voice connected'))}
            </div>

            {/* Audio Waveform Animation */}
            <div className="voice-waveform-visualizer">
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 24 : 4 }} />
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 38 : 4 }} />
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 28 : 4 }} />
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 44 : 4 }} />
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 30 : 4 }} />
              <span className="voice-waveform-bar" style={{ height: (isSpeaking || !voiceMuted) ? 18 : 4 }} />
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 360, textAlign: 'center' }}>
              {persona.voiceTone || 'Speak naturally. Your companion responds with emotional intelligence and voice.'}
            </p>
          </div>

          <div className="voice-space-footer">
            <button
              className="voice-control-btn mute"
              onClick={() => setVoiceMuted(!voiceMuted)}
            >
              {voiceMuted ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{voiceMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              className="voice-control-btn end"
              onClick={() => {
                stopSpeech();
                setVoiceModeActive(false);
              }}
            >
              <span>End Voice Space</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------- 6. "THINGS WE REMEMBER" RELATIONSHIP MEMORY DRAWER ---------- */}
      {showMemory && (
        <>
          <div
            className="memory-drawer-backdrop"
            onClick={() => setShowMemory(false)}
            aria-hidden="true"
          />
          <aside className="memory-drawer-panel" role="dialog" aria-label="Relationship Memories">
            <div className="memory-drawer-header">
              <div className="memory-drawer-title-wrap">
                <Brain size={22} color="#c084fc" />
                <h3 className="memory-drawer-title">Things We Remember</h3>
              </div>
              <button
                className="memory-drawer-close-btn"
                onClick={() => setShowMemory(false)}
                aria-label="Close memory drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Persona Relationship Profile */}
            <div className="memory-persona-card">
              <div className="memory-persona-thumb">
                <img
                  src={persona.image}
                  alt={persona.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="memory-persona-info">
                <h4>{persona.name}</h4>
                <p>Your {persona.role}</p>
                <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                  {persona.status || 'Active Connection'}
                </span>
              </div>
            </div>

            <div className="memory-items-headline">Shared Moments & Insights</div>

            <div className="memory-items-container">
              {memories && memories.length > 0 ? (
                memories.map((mem, mIdx) => (
                  <div key={mIdx} className="memory-item-capsule">
                    ✨ {typeof mem === 'string' ? mem : (mem.summary || JSON.stringify(mem))}
                  </div>
                ))
              ) : (
                <div className="memory-item-empty">
                  <p>No recorded memories yet.</p>
                  <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    As you talk with {persona.name}, meaningful moments and reflections will be automatically remembered here.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
