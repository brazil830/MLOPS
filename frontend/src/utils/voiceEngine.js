/**
 * TALKIE AI VOICE ENGINE
 * Immersive Text-to-Speech synthesis tailored specifically for each persona.
 */

export const PERSONA_VOICE_PROFILES = {
  mother: {
    gender: 'female',
    pitch: 1.08,
    rate: 0.93,
    lang: 'en-US',
    keywords: ['female', 'zira', 'samantha', 'karen', 'victoria', 'natural', 'google us english'],
  },
  father: {
    gender: 'male',
    pitch: 0.84,
    rate: 0.90,
    lang: 'en-US',
    keywords: ['male', 'david', 'daniel', 'george', 'guy', 'google us english'],
  },
  best_friend: {
    gender: 'any',
    pitch: 1.06,
    rate: 1.12,
    lang: 'en-US',
    keywords: ['alex', 'natural', 'google', 'en-us'],
  },
  romantic_partner: {
    gender: 'female',
    pitch: 0.98,
    rate: 0.90,
    lang: 'en-US',
    keywords: ['female', 'samantha', 'victoria', 'zira', 'soft'],
  },
  sibling: {
    gender: 'female',
    pitch: 1.16,
    rate: 1.08,
    lang: 'en-US',
    keywords: ['female', 'zira', 'samantha'],
  },
  mentor: {
    gender: 'male',
    pitch: 0.88,
    rate: 0.92,
    lang: 'en-US',
    keywords: ['male', 'david', 'daniel', 'oliver', 'google'],
  },
  therapist: {
    gender: 'female',
    pitch: 0.96,
    rate: 0.86,
    lang: 'en-US',
    keywords: ['female', 'samantha', 'karen', 'victoria', 'calm'],
  },
  childhood_friend: {
    gender: 'male',
    pitch: 1.02,
    rate: 1.02,
    lang: 'en-US',
    keywords: ['male', 'david', 'alex', 'google'],
  },
  elder: {
    gender: 'female',
    pitch: 0.92,
    rate: 0.82,
    lang: 'en-US',
    keywords: ['female', 'karen', 'fiona', 'victoria'],
  },
  rival: {
    gender: 'male',
    pitch: 0.96,
    rate: 1.10,
    lang: 'en-US',
    keywords: ['male', 'daniel', 'david', 'guy'],
  },
  pet: {
    gender: 'any',
    pitch: 1.30,
    rate: 1.15,
    lang: 'en-US',
    keywords: ['female', 'child', 'google'],
  },
  coworker: {
    gender: 'female',
    pitch: 1.04,
    rate: 1.00,
    lang: 'en-US',
    keywords: ['female', 'zira', 'samantha', 'google'],
  },
  crush: {
    gender: 'female',
    pitch: 0.95,
    rate: 0.94,
    lang: 'en-US',
    keywords: ['female', 'victoria', 'samantha', 'soft'],
  },
  spiritual_guide: {
    gender: 'any',
    pitch: 0.88,
    rate: 0.84,
    lang: 'en-US',
    keywords: ['daniel', 'samantha', 'calm', 'serene'],
  },
  hype_friend: {
    gender: 'female',
    pitch: 1.22,
    rate: 1.18,
    lang: 'en-US',
    keywords: ['female', 'zira', 'samantha'],
  },
};

/**
 * Clean text for natural speech synthesis.
 * Strips markdown, emojis, asterisks action descriptions, and excess punctuation.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    // Remove emojis
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    // Remove action descriptions like *smiles warmly* or *wags tail*
    .replace(/\*[^*]+\*/g, '')
    // Remove markdown bold/italics/backticks
    .replace(/[*_`~#]/g, '')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best matching browser voice for a given profile.
 */
export function getBestVoice(voices, profile) {
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

  // Search by keyword preference
  if (profile.keywords) {
    for (const kw of profile.keywords) {
      const match = candidatePool.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
      if (match) return match;
    }
  }

  // Fallback to first english voice or default
  return candidatePool[0] || voices[0];
}

/**
 * Speak text with persona-specific voice settings.
 */
export function speakPersonaMessage(text, personaId, onStart, onEnd, onError) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return null;
  }

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const profile = PERSONA_VOICE_PROFILES[personaId] || {
    pitch: 1.0,
    rate: 1.0,
    lang: 'en-US',
  };

  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  utterance.lang = profile.lang || 'en-US';

  // Resolve voice
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = getBestVoice(voices, profile);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    if (onError) onError(err);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any currently active speech.
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
