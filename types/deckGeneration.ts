export type SlideType =
  | 'hook'
  | 'problem'
  | 'solution'
  | 'traction'
  | 'market'
  | 'business_model'
  | 'team'
  | 'ask';

// Legacy types from 10-slide format — used for backward compat with stored decks
export type LegacySlideType =
  | 'title'
  | 'product'
  | 'competition';

// All possible types that can appear in stored deck data
export type AnySlideType = SlideType | LegacySlideType;

export type LayoutHint =
  | 'centered'
  | 'two-column'
  | 'comparison'
  | 'cards'
  | 'big-number';

export interface GeneratedSlide {
  type: AnySlideType;
  headline: string;
  subheadline?: string;
  bullets: Array<{ text: string; detail?: string }>;
  callout?: { value: string; label: string };
  layout_hint?: LayoutHint;
}

export type GeneratedDeck = GeneratedSlide[];

export type TemplateId =
  | 'minimal-dark'
  | 'corporate-clean'
  | 'bold-gradient'
  | 'startup-fresh';

export interface DeckTemplate {
  id: TemplateId;
  name: string;
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSecondary: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  layout: {
    headlineSize: number;
    bodySize: number;
    bulletSize: number;
    padding: number;
    calloutStyle: 'card' | 'pill' | 'banner';
  };
}

export interface GenerateDeckRequest {
  companyName: string;
  description: string;
  templateId: TemplateId;
  projectId?: string;
}
