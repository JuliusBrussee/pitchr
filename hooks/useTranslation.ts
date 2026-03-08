'use client';

import { useLocaleContext } from '@/views/components/LocaleProvider';

/**
 * Convenience hook for accessing translations and current locale.
 *
 * Usage:
 *   const { t, locale } = useTranslation();
 *   <h1>{t.settings.title}</h1>
 */
export function useTranslation() {
  const { strings, locale } = useLocaleContext();
  return { t: strings, locale };
}
