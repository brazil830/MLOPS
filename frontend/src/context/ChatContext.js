'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ChatContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [memories, setMemories] = useState([]);

  /* Track online/offline */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const sendMessage = useCallback(async (text, personaId, token) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const startTime = Date.now();
    // Realistic human conversational delay: 3.0 to 4.2 seconds (max 5s)
    const targetDelayMs = 3000 + Math.random() * 1200;

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, persona_id: personaId }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      // Ensure the companion's thinking animation displays for the full natural duration (3-4.2 seconds)
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, targetDelayMs - elapsed);
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'persona',
        content: data.response,
        timestamp: new Date().toISOString(),
        emotion: data.emotion || 'neutral',
        emotionVector: data.emotion_vector || null,
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      return data;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 1500 - elapsed);
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }
      setIsTyping(false);

      /* Offline fallback */
      if (!navigator.onLine) {
        const offlineMsg = {
          id: (Date.now() + 1).toString(),
          role: 'persona',
          content: "I'm currently offline. I'll respond as soon as we're back online. 💫",
          timestamp: new Date().toISOString(),
          emotion: 'neutral',
          isOffline: true,
        };
        setMessages(prev => [...prev, offlineMsg]);
      }

      throw err;
    }
  }, []);

  const loadHistory = useCallback(async (personaId, token) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/history/${personaId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      /* fail silently — use empty state */
    }
  }, []);

  const loadMemories = useCallback(async (personaId, token) => {
    try {
      const res = await fetch(`${API_URL}/api/memory/${personaId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch {
      /* fail silently */
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setMemories([]);
    setIsTyping(false);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isTyping,
      isOnline,
      memories,
      sendMessage,
      loadHistory,
      loadMemories,
      clearChat,
      setMessages,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
