import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/types/locale';
import type { SupportedLocale } from '@/types/locale';

/**
 * Detect the best matching locale from the browser's language preferences.
 * Checks exact matches first, then prefix matches (e.g. 'es-MX' → 'es').
 */
export function detectLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const browserLangs = navigator.languages ?? [navigator.language];

  for (const lang of browserLangs) {
    const lower = lang.toLowerCase();
    // Exact match
    const exact = SUPPORTED_LOCALES.find((l) => l === lower);
    if (exact) return exact;
    // Prefix match (e.g. 'pt-BR' → 'pt')
    const prefix = lower.split('-')[0];
    const prefixMatch = SUPPORTED_LOCALES.find((l) => l === prefix);
    if (prefixMatch) return prefixMatch;
  }

  return DEFAULT_LOCALE;
}
