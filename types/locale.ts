export const SUPPORTED_LOCALES = [
  'en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface LocaleConfig {
  code: SupportedLocale;
  label: string;
  englishLabel: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  en: { code: 'en', label: 'English', englishLabel: 'English', dir: 'ltr' },
  es: { code: 'es', label: 'Español', englishLabel: 'Spanish', dir: 'ltr' },
  fr: { code: 'fr', label: 'Français', englishLabel: 'French', dir: 'ltr' },
  de: { code: 'de', label: 'Deutsch', englishLabel: 'German', dir: 'ltr' },
  pt: { code: 'pt', label: 'Português', englishLabel: 'Portuguese', dir: 'ltr' },
  ja: { code: 'ja', label: '日本語', englishLabel: 'Japanese', dir: 'ltr' },
  ko: { code: 'ko', label: '한국어', englishLabel: 'Korean', dir: 'ltr' },
  zh: { code: 'zh', label: '中文', englishLabel: 'Chinese (Simplified)', dir: 'ltr' },
};
