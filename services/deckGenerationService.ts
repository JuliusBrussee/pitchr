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

/* --- Validation --- */

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

/* --- PDF Rendering --- */

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
