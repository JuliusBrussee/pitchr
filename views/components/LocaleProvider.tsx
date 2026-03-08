'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/types/locale';
import type { SupportedLocale } from '@/types/locale';
import { detectLocale } from '@/lib/locale/detect';
import { loadTranslations, fallbackStrings } from '@/translations/index';
import type { TranslationStrings } from '@/translations/index';

const LOCALE_STORAGE_KEY = 'pitchr_locale';
const AUTO_DETECT_KEY = 'pitchr_locale_auto';

interface LocaleContextValue {
  locale: SupportedLocale;
  strings: TranslationStrings;
  isAutoDetect: boolean;
  isLoading: boolean;
  setLocale: (locale: SupportedLocale) => void;
  setAutoDetect: (auto: boolean) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  strings: fallbackStrings,
  isAutoDetect: true,
  isLoading: false,
  setLocale: () => {},
  setAutoDetect: () => {},
});

export const useLocaleContext = () => useContext(LocaleContext);

function readStoredLocale(): { locale: SupportedLocale; isAuto: boolean } {
  if (typeof window === 'undefined') return { locale: DEFAULT_LOCALE, isAuto: true };
  try {
    const autoFlag = localStorage.getItem(AUTO_DETECT_KEY);
    const isAuto = autoFlag !== 'false';

    if (isAuto) {
      return { locale: detectLocale(), isAuto: true };
    }

    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return { locale: stored as SupportedLocale, isAuto: false };
    }

    return { locale: detectLocale(), isAuto: true };
  } catch {
    return { locale: DEFAULT_LOCALE, isAuto: true };
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [strings, setStrings] = useState<TranslationStrings>(fallbackStrings);
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(false);

  // Load stored locale on mount
  useEffect(() => {
    const { locale: initial, isAuto } = readStoredLocale();
    setLocaleState(initial);
    setIsAutoDetect(isAuto);
    mountedRef.current = true;

    if (initial !== 'en') {
      setIsLoading(true);
      loadTranslations(initial)
        .then(setStrings)
        .catch(() => setStrings(fallbackStrings))
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Load translations when locale changes (after mount)
  useEffect(() => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    loadTranslations(locale)
      .then(setStrings)
      .catch(() => setStrings(fallbackStrings))
      .finally(() => setIsLoading(false));
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    setIsAutoDetect(false);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      localStorage.setItem(AUTO_DETECT_KEY, 'false');
    } catch { /* noop */ }
  }, []);

  const setAutoDetect = useCallback((auto: boolean) => {
    setIsAutoDetect(auto);
    try {
      localStorage.setItem(AUTO_DETECT_KEY, String(auto));
    } catch { /* noop */ }
    if (auto) {
      const detected = detectLocale();
      setLocaleState(detected);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, detected);
      } catch { /* noop */ }
    }
  }, []);

  return (
    <LocaleContext.Provider
      value={{ locale, strings, isAutoDetect, isLoading, setLocale, setAutoDetect }}
    >
      {children}
    </LocaleContext.Provider>
  );
}
