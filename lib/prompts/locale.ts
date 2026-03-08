import { LOCALE_CONFIGS } from '@/types/locale';
import type { SupportedLocale } from '@/types/locale';

/**
 * Append a locale directive to an LLM system prompt so the model
 * responds in the user's preferred language. No-op for English.
 */
export function withLocaleDirective(systemPrompt: string, locale: SupportedLocale): string {
  if (locale === 'en') return systemPrompt;
  const languageName = LOCALE_CONFIGS[locale].englishLabel;
  return [
    systemPrompt,
    '',
    `IMPORTANT: Write ALL user-facing text in ${languageName}. This includes verdicts, rationale, fix descriptions, rewritten scripts, checklist items, and Q&A questions/answers. Keep JSON keys, category IDs, and schema field names in English.`,
  ].join('\n');
}
