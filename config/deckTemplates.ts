import type { DeckTemplate, TemplateId } from '@/types/deckGeneration';

export const DECK_TEMPLATES: Record<TemplateId, DeckTemplate> = {
  'minimal-dark': {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    colors: {
      background: '#0f0f0f',
      backgroundSecondary: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      accent: '#ff5941',
      accentSecondary: '#ff7a66',
    },
    fonts: {
      headline: 'Helvetica-Bold',
      body: 'Helvetica',
    },
    layout: {
      headlineSize: 36,
      bodySize: 16,
      bulletSize: 14,
      padding: 50,
      calloutStyle: 'card',
    },
  },
  'corporate-clean': {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f5f5f5',
      text: '#1a1a2e',
      textSecondary: '#6b7280',
      accent: '#2563eb',
      accentSecondary: '#3b82f6',
    },
    fonts: {
      headline: 'Times-Bold',
      body: 'Helvetica',
    },
    layout: {
      headlineSize: 34,
      bodySize: 15,
      bulletSize: 13,
      padding: 55,
      calloutStyle: 'pill',
    },
  },
  'bold-gradient': {
    id: 'bold-gradient',
    name: 'Bold Gradient',
    colors: {
      background: '#1a1a2e',
      backgroundSecondary: '#2d1b69',
      text: '#ffffff',
      textSecondary: '#c4b5fd',
      accent: '#ffaa33',
      accentSecondary: '#fbbf24',
    },
    fonts: {
      headline: 'Helvetica-Bold',
      body: 'Helvetica',
    },
    layout: {
      headlineSize: 38,
      bodySize: 16,
      bulletSize: 14,
      padding: 48,
      calloutStyle: 'banner',
    },
  },
  'startup-fresh': {
    id: 'startup-fresh',
    name: 'Startup Fresh',
    colors: {
      background: '#fafafa',
      backgroundSecondary: '#f0fdf4',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#10b981',
      accentSecondary: '#34d399',
    },
    fonts: {
      headline: 'Helvetica-Bold',
      body: 'Helvetica',
    },
    layout: {
      headlineSize: 34,
      bodySize: 15,
      bulletSize: 13,
      padding: 52,
      calloutStyle: 'pill',
    },
  },
};

export const TEMPLATE_LIST = Object.values(DECK_TEMPLATES);
