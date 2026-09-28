'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { PERSONAS, EMOTION_ATMOSPHERES } from '@/data/personasData';

const PersonaContext = createContext(null);

export function PersonaProvider({ children }) {
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [emotionState, setEmotionState] = useState('neutral');

  const selectedPersona = useMemo(() => {
    if (!selectedPersonaId) return null;
    return PERSONAS.find(p => p.id === selectedPersonaId) || null;
  }, [selectedPersonaId]);

  const selectPersona = useCallback((personaId) => {
    setSelectedPersonaId(personaId);
    setEmotionState('neutral');
  }, []);

  const clearPersona = useCallback(() => {
    setSelectedPersonaId(null);
    setEmotionState('neutral');
  }, []);

  const currentAtmosphere = useMemo(() => {
    return EMOTION_ATMOSPHERES[emotionState] || EMOTION_ATMOSPHERES.neutral;
  }, [emotionState]);

  return (
    <PersonaContext.Provider value={{
      personas: PERSONAS,
      selectedPersona,
      selectedPersonaId,
      selectPersona,
      clearPersona,
      emotionState,
      setEmotionState,
      currentAtmosphere,
    }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}

export { PERSONAS, EMOTION_ATMOSPHERES };
