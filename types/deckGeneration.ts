export type SlideType =
  | 'title'
  | 'problem'
  | 'solution'
  | 'market'
  | 'product'
  | 'business_model'
  | 'traction'
  | 'competition'
  | 'team'
  | 'ask';

export interface GeneratedSlide {
  type: SlideType;
  headline: string;
  subheadline?: string;
  bullets: Array<{ text: string; detail?: string }>;
  callout?: { value: string; label: string };
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
}
