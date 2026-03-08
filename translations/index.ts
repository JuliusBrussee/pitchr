import type { SupportedLocale } from '@/types/locale';
import en from './en';

export interface TranslationStrings {
  common: {
    save: string;
    cancel: string;
    delete: string;
    export: string;
    loading: string;
    error: string;
    success: string;
    done: string;
    reset: string;
    close: string;
    back: string;
    next: string;
    confirm: string;
    retry: string;
  };
  nav: {
    dashboard: string;
    session: string;
    history: string;
    analytics: string;
    progress: string;
    arena: string;
    projects: string;
    settings: string;
    tools: string;
    currentProject: string;
    loadingProjects: string;
    noProjects: string;
    switchProjectLocked: string;
    terms: string;
    privacy: string;
    signOut: string;
    startSession: string;
    pauseSession: string;
  };
  settings: {
    title: string;
    tabs: {
      general: string;
      billing: string;
      rewards: string;
    };
    appearance: {
      title: string;
      theme: string;
      themeDescription: string;
      system: string;
      light: string;
      dark: string;
    };
    language: {
      title: string;
      description: string;
      language: string;
      autoDetect: string;
      autoDetectDescription: string;
      detected: string;
    };
    session: {
      title: string;
      timerLabel: string;
      timerDescription: string;
      projectNote: string;
    };
    onboarding: {
      title: string;
      replay: string;
      replayDescription: string;
      replayButton: string;
      resetTips: string;
      resetTipsDescription: string;
      resetTipsButton: string;
      resetTipsSuccess: string;
    };
    privacy: {
      title: string;
      loadingPrivacy: string;
      analytics: string;
      analyticsDescription: string;
      marketing: string;
      marketingDescription: string;
      analyticsError: string;
      marketingError: string;
    };
    data: {
      title: string;
      description: string;
      deleteAll: string;
      exportData: string;
      deleteConfirm: string;
      deleteSuccess: string;
      deleteFailed: string;
      exportFailed: string;
    };
  };
  analysis: {
    analyzingTitle: string;
    analyzingSubtitle: string;
    overallProgress: string;
    steps: {
      processing: string;
      analyzing: string;
      scoring: string;
      generating: string;
      preparing: string;
    };
  };
  rubric: {
    categories: {
      structure: { label: string; description: string };
      clarity: { label: string; description: string };
      evidence: { label: string; description: string };
      market: { label: string; description: string };
      delivery: { label: string; description: string };
    };
    bands: {
      needsWork: string;
      gettingThere: string;
      solid: string;
      investorReady: string;
    };
  };
  billing: {
    plans: {
      free: string;
      dayPass: string;
      pro: string;
    };
  };
  errors: {
    generic: string;
    networkError: string;
    sessionExpired: string;
  };
}

const cache = new Map<SupportedLocale, TranslationStrings>();
cache.set('en', en);

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

export async function loadTranslations(locale: SupportedLocale): Promise<TranslationStrings> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const mod = await loaders[locale]();
  cache.set(locale, mod.default);
  return mod.default;
}

export { en as fallbackStrings };
