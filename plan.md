# Pitchr Localization System — Implementation Plan

## Overview

A language-agnostic localization system that:
1. Auto-detects user locale from browser/OS and defaults correctly for all regions
2. Lets users override language with a simple setting (persisted in localStorage + synced to Supabase)
3. Localizes all UI text (labels, buttons, messages, rubric descriptions, billing copy)
4. Localizes LLM-generated feedback & Q&A prompts so Claude responds in the user's preferred language
5. Loads only the active locale's strings (no bundle bloat)

**Target markets (initial):** English, Spanish, French, German, Portuguese, Japanese, Korean, Chinese (Simplified)

---

## Phase 1: Types & Core Infrastructure

### 1.1 — `types/locale.ts`
Define the locale system types:

```typescript
export const SUPPORTED_LOCALES = [
  'en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export interface LocaleConfig {
  code: SupportedLocale;
  label: string;           // native name: "Español", "日本語"
  englishLabel: string;     // "Spanish", "Japanese"
  dir: 'ltr' | 'rtl';
}

export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  en: { code: 'en', label: 'English',    englishLabel: 'English',              dir: 'ltr' },
  es: { code: 'es', label: 'Español',    englishLabel: 'Spanish',              dir: 'ltr' },
  fr: { code: 'fr', label: 'Français',   englishLabel: 'French',               dir: 'ltr' },
  de: { code: 'de', label: 'Deutsch',    englishLabel: 'German',               dir: 'ltr' },
  pt: { code: 'pt', label: 'Português',  englishLabel: 'Portuguese',            dir: 'ltr' },
  ja: { code: 'ja', label: '日本語',      englishLabel: 'Japanese',              dir: 'ltr' },
  ko: { code: 'ko', label: '한국어',      englishLabel: 'Korean',                dir: 'ltr' },
  zh: { code: 'zh', label: '中文',        englishLabel: 'Chinese (Simplified)',  dir: 'ltr' },
};
```

### 1.2 — `lib/locale/detect.ts`
Browser-based locale detection with smart fallback:

```typescript
export function detectLocale(): SupportedLocale {
  // 1. Check localStorage override first
  // 2. navigator.languages → find best match (exact, then prefix)
  // 3. Fall back to 'en'
}
```

Uses `Intl` or `navigator.languages` to pick the best match from `SUPPORTED_LOCALES`. No external libraries needed — the browser API is sufficient.

### 1.3 — `hooks/useLocale.ts`
Locale preference hook (follows `useSettings` pattern):

```typescript
const LOCALE_STORAGE_KEY = 'pitchr_locale';

export function useLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isAutoDetected, setIsAutoDetected] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // On mount: check localStorage → if nothing saved, auto-detect
  // setLocale(code) → persist to localStorage, update state
  // resetLocale() → clear override, re-detect

  return { locale, isAutoDetected, loaded, setLocale, resetLocale };
}
```

---

## Phase 2: Translation File Structure & Loading

### 2.1 — Translation file organization

```
translations/
├── en.ts        # English (source of truth, always complete)
├── es.ts        # Spanish
├── fr.ts        # French
├── de.ts        # German
├── pt.ts        # Portuguese
├── ja.ts        # Japanese
├── ko.ts        # Korean
├── zh.ts        # Chinese (Simplified)
└── index.ts     # Lazy-loading barrel + type definitions
```

Each file exports a flat-ish, nested object matching this typed structure:

```typescript
// translations/index.ts
export interface TranslationStrings {
  common: {
    settings: string;
    cancel: string;
    save: string;
    delete: string;
    export: string;
    loading: string;
    error: string;
    success: string;
    // ...
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: { general: string; billing: string; rewards: string };
    appearance: { title: string; theme: string; themeDescription: string; system: string; light: string; dark: string };
    language: { title: string; description: string; autoDetect: string; autoDetectDescription: string };
    session: { title: string; timerLabel: string; timerDescription: string; projectNote: string };
    onboarding: { title: string; replay: string; replayDescription: string; resetTips: string; resetTipsDescription: string };
    privacy: { title: string; analytics: string; analyticsDescription: string; marketing: string; marketingDescription: string };
    data: { title: string; description: string; deleteAll: string; exportData: string; deleteConfirm: string };
  };
  rubric: {
    categories: {
      structure: { label: string; description: string };
      clarity: { label: string; description: string };
      evidence: { label: string; description: string };
      market: { label: string; description: string };
      delivery: { label: string; description: string };
    };
    bands: { needsWork: string; gettingThere: string; solid: string; investorReady: string };
  };
  session: {
    start: string;
    pause: string;
    analyzing: string;
    steps: { processing: string; analyzing: string; scoring: string; generating: string };
  };
  billing: {
    plans: { free: string; dayPass: string; pro: string };
    // plan descriptions, CTA text, etc.
  };
  analysis: {
    verdict: string;
    fixes: string;
    rewrite: string;
    metrics: string;
    engagement: { good: string; needsWork: string; poor: string };
  };
  nav: {
    dashboard: string;
    session: string;
    history: string;
    projects: string;
    settings: string;
    arena: string;
  };
  errors: {
    generic: string;
    exportFailed: string;
    clearFailed: string;
    checkoutFailed: string;
  };
}
```

### 2.2 — `translations/index.ts` — Lazy loader

```typescript
import type { SupportedLocale } from '@/types/locale';
import en from './en';   // English is bundled (always available instantly)

const loaders: Record<SupportedLocale, () => Promise<{ default: TranslationStrings }>> = {
  en: () => Promise.resolve({ default: en }),
  es: () => import('./es'),
  fr: () => import('./fr'),
  de: () => import('./de'),
  pt: () => import('./pt'),
  ja: () => import('./ja'),
  ko: () => import('./ko'),
  zh: () => import('./zh'),
};

const cache = new Map<SupportedLocale, TranslationStrings>();
cache.set('en', en);

export async function loadTranslations(locale: SupportedLocale): Promise<TranslationStrings> {
  if (cache.has(locale)) return cache.get(locale)!;
  const mod = await loaders[locale]();
  cache.set(locale, mod.default);
  return mod.default;
}
```

**Key design decisions:**
- English is statically imported (zero latency for majority of users)
- Other languages are dynamically imported (code-split by Next.js automatically)
- In-memory cache means re-renders don't re-fetch
- No external i18n library — just TypeScript types + dynamic imports

### 2.3 — Interpolation utility

```typescript
// lib/locale/interpolate.ts
// Simple {{variable}} interpolation — no library needed
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}
```

---

## Phase 3: React Integration (Provider + Hook)

### 3.1 — `views/components/LocaleProvider.tsx`
Context provider wrapping the app (siblings with `ThemeProvider`):

```typescript
interface LocaleContextValue {
  locale: SupportedLocale;
  strings: TranslationStrings;
  setLocale: (locale: SupportedLocale) => void;
  isAutoDetected: boolean;
  resetLocale: () => void;
  isLoading: boolean;
}

// Provider loads translations on locale change, exposes strings + setter
// Shows English while async translations load (no flash of missing text)
```

### 3.2 — `hooks/useTranslation.ts`
Convenience hook (thin wrapper):

```typescript
export function useTranslation() {
  const { strings, locale } = useLocale();
  return { t: strings, locale };
  // Usage: const { t } = useTranslation();
  //        <h1>{t.settings.title}</h1>
}
```

**Why no `t('key.path')` function?** Direct property access gives:
- Full TypeScript autocomplete
- Compile-time error if a key is missing
- Zero runtime key-path parsing overhead

### 3.3 — Mount in `app/layout.tsx`

```tsx
<ThemeProvider>
  <LocaleProvider>    {/* NEW */}
    {children}
  </LocaleProvider>
</ThemeProvider>
```

---

## Phase 4: Settings UI — Language Selector

### 4.1 — Add Language section to `GeneralTab.tsx`
New `SectionCard` at the top of GeneralTab (most important setting for international users), placed right after Appearance:

```
┌────────────────────────────────────────────┐
│ 🌐 Language                                │
│                                            │
│ Language   [Auto-detect ▾] or [Español ▾]  │
│ Detected: Spanish (Spain)                  │
│                                            │
│ [✓] Auto-detect from browser              │
│ When enabled, Pitchr matches your          │
│ browser/OS language automatically.         │
└────────────────────────────────────────────┘
```

**UX behavior:**
- Toggle: "Auto-detect from browser" (on by default)
- When auto-detect is ON: shows detected language, dropdown is disabled/dimmed
- When auto-detect is OFF: dropdown becomes active, user picks from list
- Language names shown in their native script + English in parentheses: "Español (Spanish)"
- Change takes effect immediately (no page reload — React re-renders with new strings)

### 4.2 — Persistence strategy
- **Primary:** `localStorage` key `pitchr_locale` — instant load on next visit
- **Secondary (future):** Sync to Supabase `settings` table when user is logged in — survives device switches. This can be added later when the settings table supports custom fields, without changing the hook API.
- **Load order:** localStorage → auto-detect → `'en'`

---

## Phase 5: LLM Prompt Localization (Feedback + Q&A)

### 5.1 — Approach: Instruct Claude to respond in the user's language

**We do NOT translate the system prompts themselves.** Claude understands English prompts and can respond in any language. The approach:

1. Add a locale directive to the judge system prompt tail:
   ```
   IMPORTANT: Write ALL user-facing text (one_line_verdict, reasoning,
   fix descriptions, rewritten_script) in {{language}}.
   Keep JSON keys and category IDs in English.
   ```

2. Same for Q&A agent prompt:
   ```
   Conduct the entire Q&A session in {{language}}.
   Ask questions and evaluate answers in {{language}}.
   ```

3. Same for rewrite prompt, deck generation, etc.

### 5.2 — Implementation

**`lib/prompts/locale.ts`** — helper to append locale directive:

```typescript
export function withLocaleDirective(systemPrompt: string, locale: SupportedLocale): string {
  if (locale === 'en') return systemPrompt;  // no-op for English
  const languageName = LOCALE_CONFIGS[locale].englishLabel;
  return `${systemPrompt}\n\nIMPORTANT: Write ALL user-facing text in ${languageName}. Keep JSON keys, category IDs, and schema field names in English.`;
}
```

**Modify these files to accept + pass locale:**
- `lib/prompts/judge.ts` — `JUDGE_SYSTEM_PROMPT` builder gets locale param
- `lib/prompts/qaAgent.ts` — `buildQaAgentSystemPrompt` gets locale param
- `lib/prompts/rewrite.ts` — rewrite prompt gets locale param
- `lib/prompts/deckGeneration.ts` — deck text generation gets locale param
- `services/judgeAgentService.ts` — passes locale through
- `services/analysisService.ts` — passes locale through
- Edge functions that call analysis — accept locale from request headers

### 5.3 — Passing locale to API/Edge

Add `X-Pitchr-Locale` header to all `fetchEdge()` calls:

```typescript
// lib/supabase/fetch-edge.ts — enhance to include locale header
// The locale value comes from the LocaleProvider context
```

Edge functions read this header and pass it down to prompt builders. This keeps the locale plumbing minimal — one header, read in one place per edge function.

---

## Phase 6: Component Migration (Incremental)

### Strategy: Migrate in priority order, not all at once

**Priority 1 — High-visibility surfaces:**
1. Settings page (`GeneralTab`, `BillingTab`, `SettingsTabBar`)
2. Navigation/sidebar labels
3. Session page (start/pause buttons, analyzing overlay)
4. Results page (rubric labels, score bands, verdict)
5. Dashboard

**Priority 2 — Secondary surfaces:**
6. History page
7. Q&A page
8. Arena page
9. Onboarding flow
10. Error messages & toasts

**Priority 3 — Marketing & edge cases:**
11. Marketing pages
12. Compliance/privacy pages
13. Email templates (future)

### Migration pattern per component:

**Before:**
```tsx
<SettingRow label="Theme" description="Choose your preferred color mode">
```

**After:**
```tsx
const { t } = useTranslation();
// ...
<SettingRow label={t.settings.appearance.theme} description={t.settings.appearance.themeDescription}>
```

### Config files migration:

For `config/rubric.ts` — the config keeps English as source of truth (used in prompts). A separate `getRubricLabels(locale)` function returns localized display strings:

```typescript
// config/rubric.ts stays unchanged (English, used in LLM prompts)
// Components use t.rubric.categories.structure.label instead of RUBRIC_CATEGORIES[0].label
```

---

## Phase 7: Translation Content

### 7.1 — English source file (`translations/en.ts`)
Extract all hardcoded strings from components into the structured `TranslationStrings` object. This becomes the canonical reference.

### 7.2 — Other language files
Each file implements the same `TranslationStrings` interface. TypeScript enforces completeness — missing keys cause compile errors.

Initial translation approach:
- Use Claude to generate high-quality initial translations from the English source
- Flag translations for professional review before launch
- Each file is ~200-300 string entries (manageable)

---

## Phase 8: Testing

### 8.1 — Unit tests
- `lib/locale/detect.test.ts` — locale detection with mocked `navigator.languages`
- `hooks/useLocale.test.ts` — persistence, auto-detect toggle, fallback
- `lib/locale/interpolate.test.ts` — variable interpolation
- `translations/completeness.test.ts` — verify all locale files have same keys as `en.ts`

### 8.2 — Integration tests
- Settings language selector renders and switches
- Components re-render with new strings on locale change
- LLM prompts include correct locale directive

---

## File Change Summary

### New files:
| File | Purpose |
|------|---------|
| `types/locale.ts` | Locale types, supported locales, configs |
| `lib/locale/detect.ts` | Browser locale detection |
| `lib/locale/interpolate.ts` | `{{var}}` string interpolation |
| `lib/prompts/locale.ts` | LLM locale directive helper |
| `hooks/useLocale.ts` | Locale preference hook (localStorage) |
| `views/components/LocaleProvider.tsx` | React context provider |
| `hooks/useTranslation.ts` | Convenience hook for components |
| `translations/en.ts` | English strings (source of truth) |
| `translations/es.ts` | Spanish |
| `translations/fr.ts` | French |
| `translations/de.ts` | German |
| `translations/pt.ts` | Portuguese |
| `translations/ja.ts` | Japanese |
| `translations/ko.ts` | Korean |
| `translations/zh.ts` | Chinese (Simplified) |
| `translations/index.ts` | Lazy loader + types |

### Modified files:
| File | Change |
|------|--------|
| `app/layout.tsx` | Wrap with `LocaleProvider` |
| `hooks/useSettings.ts` | Add `locale` field to `PitchrSettings` (optional, for Supabase sync later) |
| `views/components/settings/GeneralTab.tsx` | Add Language section + migrate strings |
| `views/components/settings/SettingsTabBar.tsx` | Migrate tab labels |
| `lib/prompts/judge.ts` | Accept locale, append directive |
| `lib/prompts/qaAgent.ts` | Accept locale, append directive |
| `lib/prompts/rewrite.ts` | Accept locale, append directive |
| `lib/supabase/fetch-edge.ts` | Add `X-Pitchr-Locale` header |
| `services/judgeAgentService.ts` | Pass locale to prompt builder |
| `services/analysisService.ts` | Pass locale through pipeline |
| All UI components (incremental) | Replace hardcoded strings with `t.*` |

---

## Architecture Principles

1. **No external i18n library** — TypeScript types + dynamic imports give us type-safe translations with zero dependencies
2. **English bundled, others lazy-loaded** — optimal for the majority-English user base
3. **Auto-detect by default** — users in Spain see Spanish without touching settings
4. **One-click override** — English is always one click away for anyone
5. **LLM responds in user language** — Claude handles multilingual output natively; we just tell it which language via prompt directive
6. **Incremental migration** — components can be migrated one-by-one; untranslated strings fall back to English
7. **Compile-time safety** — TypeScript interface ensures all locales have all keys
