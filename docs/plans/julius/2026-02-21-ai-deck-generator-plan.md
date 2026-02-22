# AI Pitch Deck Generator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate professional 10-slide pitch deck PDFs from a freeform text prompt using Claude + `@react-pdf/renderer`, with 4 visual template presets.

**Architecture:** Single-shot generation — one API call (`POST /api/deck/generate`) triggers one LLM call to produce structured slide JSON, which is rendered to PDF server-side via `@react-pdf/renderer`, uploaded to Supabase Storage, and stored as a `DeckRecord`. The frontend shows a generation modal with template picker and freeform input form.

**Tech Stack:** Next.js App Router, `@react-pdf/renderer`, Claude via `lib/llm/router.ts`, Supabase (Storage + Postgres), React 19, Tailwind CSS.

**Design doc:** `docs/plans/2026-02-21-ai-deck-generator-design.md`

---

## Task 1: Install @react-pdf/renderer

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `yarn add @react-pdf/renderer`

**Step 2: Verify installation**

Run: `node -e "require('@react-pdf/renderer')"`
Expected: no errors

**Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "feat: add @react-pdf/renderer dependency for PDF deck generation"
```

---

## Task 2: Define types and template config

**Files:**
- Create: `types/deckGeneration.ts`
- Create: `config/deckTemplates.ts`

**Step 1: Create the slide generation types**

Create `types/deckGeneration.ts`:

```typescript
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
```

**Step 2: Create the 4 template definitions**

Create `config/deckTemplates.ts`:

```typescript
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
```

**Step 3: Commit**

```bash
git add types/deckGeneration.ts config/deckTemplates.ts
git commit -m "feat: add deck generation types and 4 template definitions"
```

---

## Task 3: Create LLM prompt for deck generation

**Files:**
- Create: `lib/prompts/deckGeneration.ts`

**Step 1: Write the prompts**

Create `lib/prompts/deckGeneration.ts`. This file exports two functions following the same pattern as `lib/prompts/rubric.ts`:

```typescript
import type { GeneratedSlide } from '@/types/deckGeneration';

export const DECK_GENERATION_SYSTEM_PROMPT = `You are a world-class pitch deck writer who has crafted decks for YC Demo Day, a16z, and Sequoia-funded startups.

You create concise, high-impact slide content that tells a compelling investment story.

Rules:
- Return valid JSON only. No markdown wrapping, no explanations.
- Every headline must work as a standalone statement (max 8 words).
- Bullet text must be punchy and scannable (max 8 words per bullet text).
- Bullet detail provides supporting context (max 20 words).
- Use specific numbers, names, and data wherever possible. If the user hasn't provided specific data, create realistic placeholder figures clearly marked with [placeholder].
- Follow a narrative arc: Problem -> Solution -> Why this team, why now -> The ask.
- Callout values should be the single most impressive stat on that slide.`;

export const DECK_GENERATION_SCHEMA_TEXT = `[
  {
    "type": "title",
    "headline": "Company tagline (max 8 words)",
    "subheadline": "One sentence value proposition",
    "bullets": [],
    "callout": null
  },
  {
    "type": "problem",
    "headline": "Problem headline",
    "subheadline": "Context sentence",
    "bullets": [
      { "text": "Pain point 1", "detail": "Supporting detail" },
      { "text": "Pain point 2", "detail": "Supporting detail" },
      { "text": "Pain point 3", "detail": "Supporting detail" }
    ],
    "callout": { "value": "$X", "label": "Cost of problem" }
  },
  {
    "type": "solution",
    "headline": "Solution headline",
    "subheadline": "How it works in one sentence",
    "bullets": [
      { "text": "Capability 1", "detail": "What it does" },
      { "text": "Capability 2", "detail": "What it does" },
      { "text": "Capability 3", "detail": "What it does" }
    ],
    "callout": { "value": "Xmin", "label": "Time to value" }
  },
  {
    "type": "market",
    "headline": "Market headline",
    "subheadline": "Market context",
    "bullets": [
      { "text": "TAM", "detail": "$X total addressable market" },
      { "text": "SAM", "detail": "$X serviceable market" },
      { "text": "SOM", "detail": "$X initial target" }
    ],
    "callout": { "value": "$XB", "label": "TAM" }
  },
  {
    "type": "product",
    "headline": "Product headline",
    "subheadline": "Product description",
    "bullets": [
      { "text": "Feature 1", "detail": "Description" },
      { "text": "Feature 2", "detail": "Description" },
      { "text": "Feature 3", "detail": "Description" }
    ],
    "callout": null
  },
  {
    "type": "business_model",
    "headline": "Business model headline",
    "subheadline": "Revenue model summary",
    "bullets": [
      { "text": "Revenue stream", "detail": "How it works" },
      { "text": "Pricing", "detail": "Price points" },
      { "text": "Unit economics", "detail": "Key metric" }
    ],
    "callout": { "value": "$X", "label": "ARR or MRR" }
  },
  {
    "type": "traction",
    "headline": "Traction headline",
    "subheadline": "Growth context",
    "bullets": [
      { "text": "Metric 1", "detail": "Number and context" },
      { "text": "Metric 2", "detail": "Number and context" },
      { "text": "Metric 3", "detail": "Number and context" }
    ],
    "callout": { "value": "X%", "label": "MoM growth" }
  },
  {
    "type": "competition",
    "headline": "Competition headline",
    "subheadline": "Competitive landscape",
    "bullets": [
      { "text": "Competitor 1", "detail": "What they lack" },
      { "text": "Competitor 2", "detail": "What they lack" },
      { "text": "Our moat", "detail": "Why we win" }
    ],
    "callout": null
  },
  {
    "type": "team",
    "headline": "Team headline",
    "subheadline": "Why this team",
    "bullets": [
      { "text": "Founder 1", "detail": "Role and background" },
      { "text": "Founder 2", "detail": "Role and background" },
      { "text": "Key hire", "detail": "Role and background" }
    ],
    "callout": null
  },
  {
    "type": "ask",
    "headline": "The Ask",
    "subheadline": "What we're raising",
    "bullets": [
      { "text": "Use of funds 1", "detail": "X% — what it achieves" },
      { "text": "Use of funds 2", "detail": "X% — what it achieves" },
      { "text": "Use of funds 3", "detail": "X% — what it achieves" }
    ],
    "callout": { "value": "$XM", "label": "Raising" }
  }
]`;

export function buildDeckGenerationPrompt(
  companyName: string,
  description: string,
): string {
  return `Create a 10-slide pitch deck for this startup:

Company: ${companyName}

Description:
"""
${description}
"""

Generate exactly 10 slides in this order: title, problem, solution, market, product, business_model, traction, competition, team, ask.

For the title slide, use "${companyName}" as the company name in the subheadline.

Return a JSON array of 10 slide objects matching this exact schema:
${DECK_GENERATION_SCHEMA_TEXT}`;
}

export function buildDeckRepairPrompt(
  invalidOutput: string,
  companyName: string,
  description: string,
): string {
  return `The previous model output is invalid JSON or does not match the required schema.
Repair it into valid JSON only — a JSON array of exactly 10 slide objects.

Company: ${companyName}
Description:
"""
${description}
"""

Invalid output:
"""
${invalidOutput}
"""

Return only a valid JSON array of 10 objects matching this schema:
${DECK_GENERATION_SCHEMA_TEXT}`;
}
```

**Step 2: Commit**

```bash
git add lib/prompts/deckGeneration.ts
git commit -m "feat: add LLM prompts for pitch deck generation"
```

---

## Task 4: Create the deck generation service

**Files:**
- Create: `services/deckGenerationService.ts`

This is the core service. It calls the LLM, validates the output, renders the PDF, uploads to Supabase, and inserts DB records. Follow the same parse-repair-fallback pattern used in `services/analysisService.ts`.

**Step 1: Create the service**

Create `services/deckGenerationService.ts`:

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { DECK_TEMPLATES } from '@/config/deckTemplates';
import { completeWithLlmRouter } from '@/lib/llm/router';
import {
  DECK_GENERATION_SYSTEM_PROMPT,
  buildDeckGenerationPrompt,
  buildDeckRepairPrompt,
} from '@/lib/prompts/deckGeneration';
import {
  uploadToStorage,
  insertDeck,
  insertSlides,
} from '@/services/deckService';
import type { DeckRecord } from '@/services/deckService';
import type {
  GeneratedDeck,
  GeneratedSlide,
  GenerateDeckRequest,
  SlideType,
  TemplateId,
} from '@/types/deckGeneration';
import { DeckDocument } from '@/views/components/deck-pdf/DeckDocument';

const SLIDE_TYPES_IN_ORDER: SlideType[] = [
  'title', 'problem', 'solution', 'market', 'product',
  'business_model', 'traction', 'competition', 'team', 'ask',
];

/* ─── Validation ─── */

function isGeneratedSlide(value: unknown): value is GeneratedSlide {
  if (!value || typeof value !== 'object') return false;
  const slide = value as Record<string, unknown>;
  return (
    typeof slide.type === 'string' &&
    SLIDE_TYPES_IN_ORDER.includes(slide.type as SlideType) &&
    typeof slide.headline === 'string' &&
    Array.isArray(slide.bullets)
  );
}

function isGeneratedDeck(value: unknown): value is GeneratedDeck {
  if (!Array.isArray(value) || value.length !== 10) return false;
  return value.every(isGeneratedSlide);
}

function parseJsonArray(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON array from surrounding text
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Model output is not valid JSON');
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

/* ─── LLM Call + Parse ─── */

async function generateSlideContent(
  companyName: string,
  description: string,
): Promise<GeneratedDeck> {
  const userPrompt = buildDeckGenerationPrompt(companyName, description);

  let rawOutput: string | null = null;
  let parsed: GeneratedDeck | null = null;

  // First attempt
  try {
    rawOutput = await completeWithLlmRouter({
      systemPrompt: DECK_GENERATION_SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.4,
      maxTokens: 8192,
    });

    const candidate = parseJsonArray(rawOutput);
    if (isGeneratedDeck(candidate)) {
      parsed = candidate;
    }
  } catch {
    parsed = null;
  }

  // Repair attempt
  if (!parsed && rawOutput) {
    try {
      const repaired = await completeWithLlmRouter({
        systemPrompt: DECK_GENERATION_SYSTEM_PROMPT,
        userPrompt: buildDeckRepairPrompt(rawOutput, companyName, description),
        responseFormat: 'json',
        temperature: 0.3,
        maxTokens: 8192,
      });

      const repairedCandidate = parseJsonArray(repaired);
      if (isGeneratedDeck(repairedCandidate)) {
        parsed = repairedCandidate;
      }
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    throw new Error('Failed to generate valid slide content after retry');
  }

  return parsed;
}

/* ─── PDF Rendering ─── */

async function renderDeckPdf(
  slides: GeneratedDeck,
  templateId: TemplateId,
  companyName: string,
): Promise<Buffer> {
  const template = DECK_TEMPLATES[templateId];

  const pdfBuffer = await renderToBuffer(
    React.createElement(DeckDocument, { slides, template, companyName }),
  );

  return Buffer.from(pdfBuffer);
}

/* ─── Main Export ─── */

export async function generateDeck(
  request: GenerateDeckRequest,
): Promise<DeckRecord> {
  const { companyName, description, templateId } = request;

  // 1. Generate slide content via LLM
  const slides = await generateSlideContent(companyName, description);

  // 2. Render PDF
  const pdfBuffer = await renderDeckPdf(slides, templateId, companyName);

  // 3. Upload PDF to Supabase Storage
  const deckId = crypto.randomUUID();
  const pdfUrl = await uploadToStorage(
    deckId,
    'slides.pdf',
    pdfBuffer,
    'application/pdf',
  );

  // 4. Insert deck record
  const deck = await insertDeck({
    name: `${companyName} — Pitch Deck`,
    original_url: pdfUrl,
    pdf_url: pdfUrl,
    slide_count: 10,
    thumbnail_url: null,
  });

  // 5. Insert per-slide text for search/context
  const slideRecords = slides.map((slide, index) => ({
    slideNum: index + 1,
    text: `${slide.headline}\n${slide.subheadline || ''}\n${slide.bullets.map((b) => `${b.text}: ${b.detail || ''}`).join('\n')}`,
  }));
  await insertSlides(deck.id, slideRecords);

  return deck;
}
```

**Step 2: Commit**

```bash
git add services/deckGenerationService.ts
git commit -m "feat: add deck generation service (LLM + PDF render + upload)"
```

---

## Task 5: Create @react-pdf slide components

**Files:**
- Create: `views/components/deck-pdf/styles.ts`
- Create: `views/components/deck-pdf/SlideBase.tsx`
- Create: `views/components/deck-pdf/TitleSlide.tsx`
- Create: `views/components/deck-pdf/ContentSlide.tsx`
- Create: `views/components/deck-pdf/MetricsSlide.tsx`
- Create: `views/components/deck-pdf/ComparisonSlide.tsx`
- Create: `views/components/deck-pdf/TeamSlide.tsx`
- Create: `views/components/deck-pdf/AskSlide.tsx`
- Create: `views/components/deck-pdf/DeckDocument.tsx`

**Important notes for the implementer:**
- `@react-pdf/renderer` uses its own `StyleSheet` — NOT Tailwind, NOT CSS. It's a subset of CSS-like styles applied via `StyleSheet.create()`.
- Components use `<Document>`, `<Page>`, `<View>`, `<Text>` from `@react-pdf/renderer` — NOT HTML elements.
- All styles must use numeric values for sizes (no `rem`, `em`, `vh`). Units are points (1pt = 1/72 inch).
- Supported fonts: Helvetica, Helvetica-Bold, Times-Roman, Times-Bold, Courier, Courier-Bold (built-in).
- Pages should be `size="A4" orientation="landscape"`.
- Each component receives `{ slide: GeneratedSlide; template: DeckTemplate }` as props.
- Check `@react-pdf/renderer` docs for supported style properties — no `gap`, use `marginTop`/`marginLeft` instead.

**Step 1: Create shared styles helper**

Create `views/components/deck-pdf/styles.ts`:

```typescript
import { StyleSheet } from '@react-pdf/renderer';
import type { DeckTemplate } from '@/types/deckGeneration';

export function createSlideStyles(template: DeckTemplate) {
  return StyleSheet.create({
    page: {
      backgroundColor: template.colors.background,
      padding: template.layout.padding,
      position: 'relative',
    },
    accentBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: template.colors.accent,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 16,
      right: 24,
      fontSize: 10,
      color: template.colors.textSecondary,
      fontFamily: template.fonts.body,
    },
    headline: {
      fontSize: template.layout.headlineSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      marginBottom: 8,
    },
    subheadline: {
      fontSize: template.layout.bodySize,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginBottom: 24,
    },
    bulletContainer: {
      marginTop: 12,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: template.colors.accent,
      marginTop: 5,
      marginRight: 12,
    },
    bulletTextGroup: {
      flex: 1,
    },
    bulletText: {
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    bulletDetail: {
      fontSize: template.layout.bulletSize - 2,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 2,
    },
    calloutBox: {
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 20,
      borderLeftWidth: 3,
      borderLeftColor: template.colors.accent,
    },
    calloutValue: {
      fontSize: 32,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    calloutLabel: {
      fontSize: 11,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 4,
    },
  });
}
```

**Step 2: Create SlideBase component**

Create `views/components/deck-pdf/SlideBase.tsx` — wraps every slide with page chrome (accent bar, page number):

```typescript
import { Page, View, Text } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate } from '@/types/deckGeneration';
import { createSlideStyles } from './styles';

interface SlideBaseProps {
  template: DeckTemplate;
  pageNumber: number;
  children: React.ReactNode;
}

export function SlideBase({ template, pageNumber, children }: SlideBaseProps) {
  const styles = createSlideStyles(template);

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {children}
      <View style={styles.accentBar} />
      <Text style={styles.pageNumber}>{pageNumber}</Text>
    </Page>
  );
}
```

**Step 3: Create TitleSlide**

Create `views/components/deck-pdf/TitleSlide.tsx`:

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';

interface TitleSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  companyName: string;
}

export function TitleSlide({ slide, template, companyName }: TitleSlideProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    companyName: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.accent,
      marginBottom: 16,
      letterSpacing: 3,
    },
    headline: {
      fontSize: 44,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subheadline: {
      fontSize: 18,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 500,
    },
  });

  return (
    <SlideBase template={template} pageNumber={1}>
      <View style={styles.container}>
        <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
        <Text style={styles.headline}>{slide.headline}</Text>
        {slide.subheadline && (
          <Text style={styles.subheadline}>{slide.subheadline}</Text>
        )}
      </View>
    </SlideBase>
  );
}
```

**Step 4: Create ContentSlide** (shared for Problem, Solution, Product, Business Model)

Create `views/components/deck-pdf/ContentSlide.tsx`:

```typescript
import { View, Text } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface ContentSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function ContentSlide({ slide, template, pageNumber }: ContentSlideProps) {
  const styles = createSlideStyles(template);

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={styles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={styles.subheadline}>{slide.subheadline}</Text>
      )}
      {slide.callout && (
        <View style={styles.calloutBox}>
          <Text style={styles.calloutValue}>{slide.callout.value}</Text>
          <Text style={styles.calloutLabel}>{slide.callout.label}</Text>
        </View>
      )}
      <View style={styles.bulletContainer}>
        {slide.bullets.map((bullet, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <View style={styles.bulletTextGroup}>
              <Text style={styles.bulletText}>{bullet.text}</Text>
              {bullet.detail && (
                <Text style={styles.bulletDetail}>{bullet.detail}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
```

**Step 5: Create MetricsSlide** (for Market and Traction — prominent callout + bullets)

Create `views/components/deck-pdf/MetricsSlide.tsx`:

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface MetricsSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function MetricsSlide({ slide, template, pageNumber }: MetricsSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    twoColumn: {
      flexDirection: 'row',
      flex: 1,
      marginTop: 16,
    },
    left: {
      width: '40%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    right: {
      width: '60%',
      paddingLeft: 24,
    },
    bigCalloutValue: {
      fontSize: 48,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    bigCalloutLabel: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 6,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={styles.twoColumn}>
        {slide.callout && (
          <View style={styles.left}>
            <Text style={styles.bigCalloutValue}>{slide.callout.value}</Text>
            <Text style={styles.bigCalloutLabel}>{slide.callout.label}</Text>
          </View>
        )}
        <View style={slide.callout ? styles.right : { width: '100%' }}>
          <View style={baseStyles.bulletContainer}>
            {slide.bullets.map((bullet, i) => (
              <View key={i} style={baseStyles.bulletRow}>
                <View style={baseStyles.bulletDot} />
                <View style={baseStyles.bulletTextGroup}>
                  <Text style={baseStyles.bulletText}>{bullet.text}</Text>
                  {bullet.detail && (
                    <Text style={baseStyles.bulletDetail}>{bullet.detail}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SlideBase>
  );
}
```

**Step 6: Create ComparisonSlide** (for Competition)

Create `views/components/deck-pdf/ComparisonSlide.tsx`:

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface ComparisonSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function ComparisonSlide({ slide, template, pageNumber }: ComparisonSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: template.colors.backgroundSecondary,
      paddingVertical: 12,
      alignItems: 'center',
    },
    labelCol: {
      width: '35%',
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    detailCol: {
      width: '65%',
      fontSize: template.layout.bulletSize - 1,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
    },
    moatRow: {
      flexDirection: 'row',
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 6,
      paddingHorizontal: 12,
      marginTop: 8,
    },
    moatLabel: {
      width: '35%',
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    moatDetail: {
      width: '65%',
      fontSize: template.layout.bulletSize - 1,
      fontFamily: template.fonts.body,
      color: template.colors.text,
    },
  });

  // Last bullet is typically "our moat" — style it differently
  const competitors = slide.bullets.slice(0, -1);
  const moat = slide.bullets[slide.bullets.length - 1];

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={{ marginTop: 16 }}>
        {competitors.map((bullet, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.labelCol}>{bullet.text}</Text>
            <Text style={styles.detailCol}>{bullet.detail}</Text>
          </View>
        ))}
        {moat && (
          <View style={styles.moatRow}>
            <Text style={styles.moatLabel}>{moat.text}</Text>
            <Text style={styles.moatDetail}>{moat.detail}</Text>
          </View>
        )}
      </View>
    </SlideBase>
  );
}
```

**Step 7: Create TeamSlide**

Create `views/components/deck-pdf/TeamSlide.tsx`:

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface TeamSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function TeamSlide({ slide, template, pageNumber }: TeamSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    cardRow: {
      flexDirection: 'row',
      marginTop: 20,
    },
    card: {
      flex: 1,
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      marginRight: 16,
      alignItems: 'center',
    },
    cardLast: {
      flex: 1,
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: template.colors.accent,
      marginBottom: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontFamily: template.fonts.headline,
      color: template.colors.background,
    },
    name: {
      fontSize: 14,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      textAlign: 'center',
    },
    role: {
      fontSize: 11,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={styles.cardRow}>
        {slide.bullets.map((member, i) => (
          <View
            key={i}
            style={i < slide.bullets.length - 1 ? styles.card : styles.cardLast}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.text.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{member.text}</Text>
            <Text style={styles.role}>{member.detail}</Text>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
```

**Step 8: Create AskSlide**

Create `views/components/deck-pdf/AskSlide.tsx`:

```typescript
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface AskSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function AskSlide({ slide, template, pageNumber }: AskSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    askAmount: {
      fontSize: 56,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
      marginBottom: 8,
    },
    askLabel: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginBottom: 32,
    },
    useFundsContainer: {
      width: '70%',
    },
    useFundsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: template.colors.backgroundSecondary,
    },
    useFundsLabel: {
      fontSize: 14,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    useFundsDetail: {
      fontSize: 13,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <View style={styles.center}>
        <Text style={baseStyles.headline}>{slide.headline}</Text>
        {slide.callout && (
          <>
            <Text style={styles.askAmount}>{slide.callout.value}</Text>
            <Text style={styles.askLabel}>{slide.callout.label}</Text>
          </>
        )}
        <View style={styles.useFundsContainer}>
          {slide.bullets.map((item, i) => (
            <View key={i} style={styles.useFundsRow}>
              <Text style={styles.useFundsLabel}>{item.text}</Text>
              <Text style={styles.useFundsDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>
      </View>
    </SlideBase>
  );
}
```

**Step 9: Create DeckDocument** (top-level component that assembles all slides)

Create `views/components/deck-pdf/DeckDocument.tsx`:

```typescript
import { Document } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedDeck } from '@/types/deckGeneration';
import { TitleSlide } from './TitleSlide';
import { ContentSlide } from './ContentSlide';
import { MetricsSlide } from './MetricsSlide';
import { ComparisonSlide } from './ComparisonSlide';
import { TeamSlide } from './TeamSlide';
import { AskSlide } from './AskSlide';

interface DeckDocumentProps {
  slides: GeneratedDeck;
  template: DeckTemplate;
  companyName: string;
}

// Maps slide types to components. Market and Traction use MetricsSlide for
// prominent callout display; Competition uses ComparisonSlide for table layout;
// Team and Ask have their own layouts; everything else uses ContentSlide.
const METRICS_TYPES = new Set(['market', 'traction']);

export function DeckDocument({ slides, template, companyName }: DeckDocumentProps) {
  return (
    <Document title={`${companyName} — Pitch Deck`} author="Pitchr">
      {slides.map((slide, index) => {
        const pageNumber = index + 1;

        if (slide.type === 'title') {
          return (
            <TitleSlide
              key={index}
              slide={slide}
              template={template}
              companyName={companyName}
            />
          );
        }

        if (METRICS_TYPES.has(slide.type)) {
          return (
            <MetricsSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (slide.type === 'competition') {
          return (
            <ComparisonSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (slide.type === 'team') {
          return (
            <TeamSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        if (slide.type === 'ask') {
          return (
            <AskSlide
              key={index}
              slide={slide}
              template={template}
              pageNumber={pageNumber}
            />
          );
        }

        // Default: Problem, Solution, Product, Business Model
        return (
          <ContentSlide
            key={index}
            slide={slide}
            template={template}
            pageNumber={pageNumber}
          />
        );
      })}
    </Document>
  );
}
```

**Step 10: Commit**

```bash
git add views/components/deck-pdf/
git commit -m "feat: add @react-pdf slide components for all 10 slide types"
```

---

## Task 6: Create the API route

**Files:**
- Create: `app/api/deck/generate/route.ts`

**Step 1: Create the route handler**

Create `app/api/deck/generate/route.ts`. Follow the same pattern as `app/api/deck/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateDeck } from '@/services/deckGenerationService';
import type { GenerateDeckRequest, TemplateId } from '@/types/deckGeneration';

const VALID_TEMPLATES = new Set<TemplateId>([
  'minimal-dark',
  'corporate-clean',
  'bold-gradient',
  'startup-fresh',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<GenerateDeckRequest>;

    // Validate companyName
    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'companyName is required' },
        { status: 400 },
      );
    }
    if (body.companyName.length > 100) {
      return NextResponse.json(
        { error: 'companyName must be 100 characters or less' },
        { status: 400 },
      );
    }

    // Validate description
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 },
      );
    }
    if (body.description.length < 10) {
      return NextResponse.json(
        { error: 'description must be at least 10 characters' },
        { status: 400 },
      );
    }
    if (body.description.length > 5000) {
      return NextResponse.json(
        { error: 'description must be 5000 characters or less' },
        { status: 400 },
      );
    }

    // Validate templateId
    if (!body.templateId || !VALID_TEMPLATES.has(body.templateId as TemplateId)) {
      return NextResponse.json(
        { error: 'templateId must be one of: minimal-dark, corporate-clean, bold-gradient, startup-fresh' },
        { status: 400 },
      );
    }

    const deck = await generateDeck({
      companyName: body.companyName.trim(),
      description: body.description.trim(),
      templateId: body.templateId as TemplateId,
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/deck/generate/route.ts
git commit -m "feat: add POST /api/deck/generate route"
```

---

## Task 7: Create the frontend GenerateDeckModal component

**Files:**
- Create: `views/components/GenerateDeckModal.tsx`

**Step 1: Create the modal component**

Create `views/components/GenerateDeckModal.tsx`. This renders the template picker, form, and handles the API call. Uses the existing glassmorphism style from the deck page. Uses `'use client'` directive, named exports, Tailwind for layout, inline `style` for theme variables.

```typescript
'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { TEMPLATE_LIST } from '@/config/deckTemplates';
import type { TemplateId } from '@/types/deckGeneration';

interface GenerateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateDeckModal({ isOpen, onClose, onSuccess }: GenerateDeckModalProps) {
  const [templateId, setTemplateId] = useState<TemplateId>('minimal-dark');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isValid = companyName.trim().length > 0 && description.trim().length >= 10;

  const handleGenerate = async () => {
    if (!isValid || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/deck/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          description: description.trim(),
          templateId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      onSuccess();
      onClose();
      setCompanyName('');
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-2xl border p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 89, 65, 0.10)' }}
            >
              <Sparkles size={18} style={{ color: '#ff5941' }} />
            </div>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Generate with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Picker */}
        <div className="mb-6">
          <label
            className="block text-xs font-semibold mb-3 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Choose a style
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TEMPLATE_LIST.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className="flex-shrink-0 w-36 rounded-xl border-2 p-3 transition-all duration-200 hover:scale-[1.03]"
                style={{
                  borderColor: templateId === t.id
                    ? t.colors.accent
                    : 'var(--border-color)',
                  backgroundColor: t.colors.background,
                  boxShadow: templateId === t.id
                    ? `0 0 16px ${t.colors.accent}33`
                    : 'none',
                }}
              >
                {/* Mini preview */}
                <div className="h-16 rounded-lg mb-2 flex flex-col justify-center px-2" style={{ backgroundColor: t.colors.backgroundSecondary }}>
                  <div
                    className="h-1.5 rounded-full mb-1.5"
                    style={{ backgroundColor: t.colors.accent, width: '60%' }}
                  />
                  <div
                    className="h-1 rounded-full mb-1"
                    style={{ backgroundColor: t.colors.textSecondary, width: '80%', opacity: 0.5 }}
                  />
                  <div
                    className="h-1 rounded-full"
                    style={{ backgroundColor: t.colors.textSecondary, width: '50%', opacity: 0.3 }}
                  />
                </div>
                <p
                  className="text-[11px] font-semibold text-center"
                  style={{ color: t.colors.text }}
                >
                  {t.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Company Name */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Acme AI"
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Pitch Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Describe your startup, product, market, traction, team, and what you're raising. The more detail you provide, the better the deck will be..."
            className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors resize-none"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex justify-end mt-1">
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {description.length} / 5,000
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!isValid || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: isGenerating
              ? 'var(--bg-surface-hover)'
              : 'linear-gradient(135deg, #ff5941, #ffaa33)',
            color: '#ffffff',
            boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(255, 89, 65, 0.3)',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating your pitch deck...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Deck
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/GenerateDeckModal.tsx
git commit -m "feat: add GenerateDeckModal component with template picker and form"
```

---

## Task 8: Wire the modal into the deck page

**Files:**
- Modify: `app/(app)/deck/page.tsx`

**Step 1: Add modal state and import**

At the top of `app/(app)/deck/page.tsx`, add the import:

```typescript
import { GenerateDeckModal } from '@/views/components/GenerateDeckModal';
```

Inside the `DeckPage` component, add state:

```typescript
const [isGenerateOpen, setIsGenerateOpen] = useState(false);
```

**Step 2: Wire the "Create with AI" card to open the modal**

Find the "Create with AI" card `<div>` (currently around line 338-399). Add an `onClick` handler to the inner card div:

```typescript
onClick={() => setIsGenerateOpen(true)}
```

**Step 3: Add the modal to the JSX**

Before the closing `</main>` tag, add:

```tsx
<GenerateDeckModal
  isOpen={isGenerateOpen}
  onClose={() => setIsGenerateOpen(false)}
  onSuccess={() => fetchDecks()}
/>
```

**Step 4: Verify the page compiles**

Run: `yarn build`
Expected: builds without errors

**Step 5: Commit**

```bash
git add app/(app)/deck/page.tsx
git commit -m "feat: wire Create with AI card to GenerateDeckModal"
```

---

## Task 9: End-to-end smoke test

**Step 1: Start the dev server**

Run: `yarn dev`

**Step 2: Test the flow manually**

1. Navigate to `http://localhost:3000/deck`
2. Click "Create with AI" card
3. Verify modal opens with 4 template previews
4. Select a template, fill in company name and description
5. Click "Generate Deck"
6. Verify loading state appears
7. After generation completes (~8-12s), verify:
   - Modal closes
   - New deck appears in grid
   - Deck name is "[CompanyName] — Pitch Deck"
   - Deck shows 10 slides

**Step 3: Test error handling**

1. Try submitting with empty fields — button should be disabled
2. Try submitting with very short description (<10 chars) — should not submit

**Step 4: Test template variations**

Generate a deck with each template to verify PDF renders correctly with each color scheme.

---

## Task 10: Fix any @react-pdf compatibility issues

This is a contingency task. `@react-pdf/renderer` sometimes has issues with Next.js App Router due to:
- Server Component vs Client Component boundaries
- Node.js stream APIs not available in Edge Runtime
- Missing fonts or style properties

**If build fails with @react-pdf errors:**
- Ensure the API route (`app/api/deck/generate/route.ts`) uses Node.js runtime (not Edge). Add at the top of the route file: `export const runtime = 'nodejs';`
- If `renderToBuffer` fails, try `renderToStream` and convert to Buffer manually
- If font loading fails, stick to built-in fonts only (Helvetica, Times, Courier)

**If styles don't render correctly:**
- Check that no unsupported CSS properties are used (no `gap`, `grid`, `box-shadow`)
- Use `flexDirection: 'row'` instead of Flexbox shorthand
- All size values must be numbers (points), not strings

**Step 1: Fix any issues found in Task 9**

**Step 2: Commit**

```bash
git add -A
git commit -m "fix: resolve @react-pdf compatibility issues"
```

---

## Summary

| Task | What | New Files |
|------|------|-----------|
| 1 | Install @react-pdf/renderer | — |
| 2 | Types + template config | `types/deckGeneration.ts`, `config/deckTemplates.ts` |
| 3 | LLM prompts | `lib/prompts/deckGeneration.ts` |
| 4 | Generation service | `services/deckGenerationService.ts` |
| 5 | PDF slide components (8 files) | `views/components/deck-pdf/*` |
| 6 | API route | `app/api/deck/generate/route.ts` |
| 7 | Frontend modal | `views/components/GenerateDeckModal.tsx` |
| 8 | Wire modal to deck page | (modify existing) |
| 9 | E2E smoke test | — |
| 10 | Compatibility fixes (contingency) | — |
