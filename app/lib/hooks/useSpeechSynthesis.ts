import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechSynthesisHook {
  isSupported: boolean;
  isSpeaking: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  speak: (text: string) => void;
  cancel: () => void;
  voices: SpeechSynthesisVoice[];
}

const STORAGE_KEY = 'supercode:ttsEnabled';

function isBrowserSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSupported] = useState(isBrowserSupported);
  const [isEnabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();

      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    // eslint-disable-next-line consistent-return
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    return () => {
      window.speechSynthesis.cancel();
      return;
    };
  }, [isSupported]);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
        } catch {
          // ignore
        }
      }

      if (!next && isSupported) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    },
    [isSupported],
  );

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !isEnabled) {
        return;
      }

      const cleaned = stripMarkdown(text);

      if (!cleaned) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1;
      utterance.pitch = 1;

      const preferred = voices.find((voice) => /en[-_]/i.test(voice.lang)) ?? voices[0];

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [isEnabled, isSupported, voices],
  );

  return { isSupported, isSpeaking, isEnabled, setEnabled, speak, cancel, voices };
}
