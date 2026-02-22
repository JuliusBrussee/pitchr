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
  'hook', 'problem', 'solution', 'traction',
  'market', 'business_model', 'team', 'ask',
];

// All valid types including legacy ones from stored 10-slide decks
const ALL_VALID_TYPES = new Set<string>([
  ...SLIDE_TYPES_IN_ORDER,
  'title', 'product', 'competition',
]);

/* --- Placeholder Stripping (defense-in-depth) --- */

const PLACEHOLDER_RE = /\[(?:placeholder|TBD|tbd|insert\s+\w+|Company|company|your\s+\w+|X+)\]/gi;

function stripPlaceholders(deck: GeneratedDeck): GeneratedDeck {
  return deck.map((slide) => ({
    ...slide,
    headline: slide.headline.replace(PLACEHOLDER_RE, '').trim(),
    subheadline: slide.subheadline?.replace(PLACEHOLDER_RE, '').trim() || undefined,
    bullets: slide.bullets
      .map((b) => ({
        text: b.text.replace(PLACEHOLDER_RE, '').trim(),
        detail: b.detail?.replace(PLACEHOLDER_RE, '').trim() || undefined,
      }))
      .filter((b) => b.text.length > 0),
    callout: slide.callout
      ? {
          value: slide.callout.value.replace(PLACEHOLDER_RE, '').trim(),
          label: slide.callout.label.replace(PLACEHOLDER_RE, '').trim(),
        }
      : undefined,
  }));
}

/* --- Validation --- */

function isGeneratedSlide(value: unknown): value is GeneratedSlide {
  if (!value || typeof value !== 'object') return false;
  const slide = value as Record<string, unknown>;
  return (
    typeof slide.type === 'string' &&
    ALL_VALID_TYPES.has(slide.type) &&
    typeof slide.headline === 'string' &&
    Array.isArray(slide.bullets)
  );
}

function isGeneratedDeck(value: unknown): value is GeneratedDeck {
  if (!Array.isArray(value)) return false;
  // Accept 7-9 slides (prefer 8, flexible for edge cases)
  if (value.length < 7 || value.length > 9) return false;
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

/* --- LLM Call + Parse --- */

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
      parsed = stripPlaceholders(candidate);
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
        parsed = stripPlaceholders(repairedCandidate);
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

/* --- PDF Rendering --- */

async function renderDeckPdf(
  slides: GeneratedDeck,
  templateId: TemplateId,
  companyName: string,
): Promise<Buffer> {
  const template = DECK_TEMPLATES[templateId];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(DeckDocument, { slides, template, companyName }) as any,
  );

  return Buffer.from(pdfBuffer);
}

/* --- Main Export --- */

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
    name: `${companyName} \u2014 Pitch Deck`,
    original_url: pdfUrl,
    pdf_url: pdfUrl,
    slide_count: slides.length,
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
