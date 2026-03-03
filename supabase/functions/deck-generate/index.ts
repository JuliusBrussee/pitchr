// Edge Function: deck-generate
// Methods: POST (AI-generate a pitch deck from company description)
//
// Calls Claude API to generate 8 slide contents, renders a styled PDF using
// the selected template, uploads to Supabase Storage, and inserts deck + slides.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, createAdminClient, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { uploadToStorage, insertDeck, insertSlides } from '../_shared/deck-service.ts';
import { checkUsageLimit, recordUsageEvent } from '../_shared/billing-service.ts';
import { resolveProjectForRequest, ProjectNotFoundError } from '../_shared/project-service.ts';
import type { TemplateId, GenerateDeckRequest } from '../_shared/types.ts';

const VALID_TEMPLATES = new Set<TemplateId>([
  'minimal-dark',
  'corporate-clean',
  'bold-gradient',
  'startup-fresh',
]);

const SLIDE_NAMES = [
  'Hook',
  'Problem',
  'Solution',
  'Traction',
  'Market',
  'Business Model',
  'Team',
  'Ask',
];

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_TIMEOUT_MS = 90_000;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

interface ClaudeResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
}

interface SlideContent {
  title: string;
  bullets: string[];
}

// ─── Template definitions (mirrored from config/deckTemplates.ts) ───

interface TemplateConfig {
  bg: string;
  text: string;
  textSecondary: string;
  accent: string;
  headlineFont: string;
  bodyFont: string;
  headlineSize: number;
  bodySize: number;
  padding: number;
}

const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  'minimal-dark': {
    bg: '#0f0f0f', text: '#ffffff', textSecondary: '#a0a0a0', accent: '#ff5941',
    headlineFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
    headlineSize: 36, bodySize: 16, padding: 50,
  },
  'corporate-clean': {
    bg: '#ffffff', text: '#1a1a2e', textSecondary: '#6b7280', accent: '#2563eb',
    headlineFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
    headlineSize: 34, bodySize: 15, padding: 55,
  },
  'bold-gradient': {
    bg: '#1a1a2e', text: '#ffffff', textSecondary: '#c4b5fd', accent: '#ffaa33',
    headlineFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
    headlineSize: 38, bodySize: 16, padding: 48,
  },
  'startup-fresh': {
    bg: '#fafafa', text: '#1f2937', textSecondary: '#6b7280', accent: '#10b981',
    headlineFont: 'Helvetica-Bold', bodyFont: 'Helvetica',
    headlineSize: 34, bodySize: 15, padding: 52,
  },
};

// ─── PDF Generator ───

// Slide dimensions: 16:9 at 72 DPI
const PAGE_W = 960;
const PAGE_H = 540;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

/** Escape special characters for PDF literal strings */
function pdfEscape(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Word-wrap text to fit within maxWidth at given fontSize (approximate) */
function wrapText(text: string, fontSize: number, maxWidth: number, fontName: string): string[] {
  // Approximate char width: Helvetica averages ~0.52 * fontSize
  const isBold = fontName.includes('Bold');
  const avgCharWidth = fontSize * (isBold ? 0.56 : 0.52);
  const maxChars = Math.floor(maxWidth / avgCharWidth);

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (test.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function buildPdf(slides: SlideContent[], templateId: TemplateId, companyName: string): Uint8Array {
  const t = TEMPLATES[templateId];
  const [bgR, bgG, bgB] = hexToRgb(t.bg);
  const [textR, textG, textB] = hexToRgb(t.text);
  const [secR, secG, secB] = hexToRgb(t.textSecondary);
  const [accR, accG, accB] = hexToRgb(t.accent);

  const objects: string[] = [];
  const offsets: number[] = [];
  let objNum = 0;

  function addObj(content: string): number {
    objNum++;
    objects.push(`${objNum} 0 obj\n${content}\nendobj\n`);
    return objNum;
  }

  // Font resources (PDF built-in fonts, no embedding needed)
  const fontBoldId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${t.headlineFont} /Encoding /WinAnsiEncoding >>`);
  const fontBodyId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${t.bodyFont} /Encoding /WinAnsiEncoding >>`);

  const fontResources = `/Font << /F1 ${fontBoldId} 0 R /F2 ${fontBodyId} 0 R >>`;

  // Build pages
  const pageIds: number[] = [];
  const contentMaxW = PAGE_W - t.padding * 2;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const lines: string[] = [];

    // Background rectangle
    lines.push(`${bgR} ${bgG} ${bgB} rg`);
    lines.push(`0 0 ${PAGE_W} ${PAGE_H} re f`);

    // Accent bar at top
    lines.push(`${accR} ${accG} ${accB} rg`);
    lines.push(`0 ${PAGE_H - 4} ${PAGE_W} 4 re f`);

    // Slide number badge
    lines.push(`${accR} ${accG} ${accB} rg`);
    const badgeText = `${i + 1} / ${slides.length}`;
    lines.push(`BT /F2 10 Tf ${secR} ${secG} ${secB} rg ${PAGE_W - t.padding - 40} ${PAGE_H - 30} Td (${pdfEscape(badgeText)}) Tj ET`);

    // Title
    let y = PAGE_H - t.padding - t.headlineSize;
    const titleLines = wrapText(slide.title, t.headlineSize, contentMaxW, t.headlineFont);
    for (const tl of titleLines) {
      lines.push(`BT /F1 ${t.headlineSize} Tf ${textR} ${textG} ${textB} rg ${t.padding} ${y} Td (${pdfEscape(tl)}) Tj ET`);
      y -= t.headlineSize + 6;
    }

    // Accent underline below title
    y -= 8;
    lines.push(`${accR} ${accG} ${accB} rg`);
    lines.push(`${t.padding} ${y} 80 3 re f`);
    y -= 24;

    // Bullets
    const bulletSpacing = t.bodySize + 10;
    for (const bullet of slide.bullets) {
      if (y < t.padding) break;

      // Bullet dot
      lines.push(`${accR} ${accG} ${accB} rg`);
      const dotY = y + t.bodySize * 0.3;
      lines.push(`${t.padding + 4} ${dotY} 3 3 re f`);

      // Bullet text (with word wrap)
      const bulletLines = wrapText(bullet, t.bodySize, contentMaxW - 24, t.bodyFont);
      for (const bl of bulletLines) {
        if (y < t.padding) break;
        lines.push(`BT /F2 ${t.bodySize} Tf ${secR} ${secG} ${secB} rg ${t.padding + 16} ${y} Td (${pdfEscape(bl)}) Tj ET`);
        y -= bulletSpacing;
      }
      y -= 4;
    }

    // Company name footer
    lines.push(`BT /F2 9 Tf ${secR} ${secG} ${secB} rg ${t.padding} 20 Td (${pdfEscape(companyName)}) Tj ET`);

    const stream = lines.join('\n');
    const contentId = addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);

    const pageId = addObj(
      `<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentId} 0 R /Resources << ${fontResources} >> >>`,
    );
    pageIds.push(pageId);
  }

  // Pages object
  const pagesId = addObj(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`,
  );

  // Catalog
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  // Replace PAGES_REF in page objects
  for (let i = 0; i < objects.length; i++) {
    objects[i] = objects[i].replace(/PAGES_REF/g, `${pagesId} 0 R`);
  }

  // Build final PDF
  const header = '%PDF-1.4\n%\xC3\xA4\xC3\xBC\xC3\xB6\xC3\x9F\n';
  let body = '';
  for (let i = 0; i < objects.length; i++) {
    offsets[i] = header.length + body.length;
    body += objects[i];
  }

  const xrefOffset = header.length + body.length;
  let xref = `xref\n0 ${objNum + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 0; i < objNum; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${objNum + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdfString = header + body + xref + trailer;
  const encoder = new TextEncoder();
  return encoder.encode(pdfString);
}

// ─── LLM Slide Generation ───

const SYSTEM_PROMPT = `You are a pitch deck expert. You create compelling, investor-ready pitch deck content.

Output rules:
- Return valid JSON only.
- Do not use markdown or explanation text outside JSON.
- Follow the requested schema exactly.`;

function buildDeckPrompt(companyName: string, description: string): string {
  return `Create pitch deck slide content for "${companyName}".

Company description:
${description}

Generate exactly 8 slides with the following structure:
1. Hook — A compelling opening headline + 1-2 sentence tagline
2. Problem — The pain point being solved, with specifics
3. Solution — How the product solves it, key features/benefits
4. Traction — Metrics, milestones, customers, growth (estimate if not provided)
5. Market — TAM/SAM/SOM sizing, target segment
6. Business Model — Revenue model, pricing, unit economics
7. Team — Key team members and relevant experience (infer roles if needed)
8. Ask — Funding amount, use of funds, vision/CTA

For each slide, write:
- A short title (2-5 words)
- 3-5 bullet points of content (each 8-20 words)
- Keep language direct, specific, and investor-oriented
- Use real numbers from the description when available; do not fabricate metrics

Return JSON matching this schema:
{
  "slides": [
    {
      "title": "string",
      "bullets": ["string", "string", "string"]
    }
  ]
}

Return exactly 8 slide objects in the array.`;
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

async function generateSlideContent(
  companyName: string,
  description: string,
): Promise<SlideContent[]> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim();
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        temperature: 0.4,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildDeckPrompt(companyName, description) }],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as ClaudeResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `Claude request failed with status ${response.status}`,
      );
    }

    const text = payload.content
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('Claude returned an empty response');
    }

    const jsonText = extractJson(text);
    const parsed = JSON.parse(jsonText);

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      throw new Error('Invalid response: missing slides array');
    }

    // Normalize to exactly 8 slides
    const slides: SlideContent[] = parsed.slides.slice(0, 8).map(
      (slide: { title?: string; bullets?: string[] }, i: number) => ({
        title: slide.title || SLIDE_NAMES[i] || `Slide ${i + 1}`,
        bullets: Array.isArray(slide.bullets) ? slide.bullets.map(String) : [],
      }),
    );

    // Pad to 8 if LLM returned fewer
    while (slides.length < 8) {
      const idx = slides.length;
      slides.push({
        title: SLIDE_NAMES[idx] || `Slide ${idx + 1}`,
        bullets: ['Content to be added'],
      });
    }

    return slides;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Deck generation timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function formatSlideText(slide: SlideContent): string {
  const lines = [slide.title, ''];
  for (const bullet of slide.bullets) {
    lines.push(`- ${bullet}`);
  }
  return lines.join('\n');
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    // Rate limit check for deck generation
    const adminClient = createAdminClient();
    const usageCheck = await checkUsageLimit(adminClient, user.id, 'deck_generation');
    if (!usageCheck.allowed) {
      return errorResponse(
        `Deck generation limit reached (${usageCheck.used}/${usageCheck.limit}). Upgrade your plan for more decks.`,
        429,
      );
    }

    const body = await req.json() as Partial<GenerateDeckRequest>;
    if (body.projectId !== undefined) {
      if (typeof body.projectId !== 'string' || !isUuid(body.projectId)) {
        return errorResponse('projectId must be a valid UUID when provided', 400);
      }
    }
    const project = await resolveProjectForRequest(supabase, user.id, {
      projectId: body.projectId,
    });

    // Validate companyName
    if (!body.companyName || typeof body.companyName !== 'string') {
      return errorResponse('companyName is required', 400);
    }
    if (body.companyName.length > 100) {
      return errorResponse('companyName must be 100 characters or less', 400);
    }

    // Validate description
    if (!body.description || typeof body.description !== 'string') {
      return errorResponse('description is required', 400);
    }
    if (body.description.length < 10) {
      return errorResponse('description must be at least 10 characters', 400);
    }
    if (body.description.length > 5000) {
      return errorResponse('description must be 5000 characters or less', 400);
    }

    // Validate templateId
    const templateId = body.templateId as TemplateId;
    if (!templateId || !VALID_TEMPLATES.has(templateId)) {
      return errorResponse(
        'templateId must be one of: minimal-dark, corporate-clean, bold-gradient, startup-fresh',
        400,
      );
    }

    const companyName = body.companyName.trim();

    // Generate slide content via Claude
    console.log('[deck-generate] generating slides for', companyName);
    const slides = await generateSlideContent(companyName, body.description.trim());
    console.log('[deck-generate] generated', slides.length, 'slides');

    // Build PDF
    console.log('[deck-generate] building PDF with template', templateId);
    const pdfBuffer = buildPdf(slides, templateId, companyName);
    console.log('[deck-generate] PDF size:', pdfBuffer.length, 'bytes');

    // Upload PDF to storage
    const deckId = crypto.randomUUID();
    const pdfUrl = await uploadToStorage(
      supabase,
      user.id,
      deckId,
      'deck.pdf',
      pdfBuffer,
      'application/pdf',
    );
    console.log('[deck-generate] uploaded PDF to', pdfUrl);

    // Insert deck record
    const deck = await insertDeck(supabase, {
      name: `${companyName} Pitch Deck`,
      original_url: pdfUrl,
      pdf_url: pdfUrl,
      slide_count: slides.length,
      thumbnail_url: null,
      project_id: project.id,
      user_id: user.id,
    });

    // Insert slide records
    const slideRows = slides.map((slide, i) => ({
      slideNum: i + 1,
      text: formatSlideText(slide),
    }));
    await insertSlides(supabase, deck.id, slideRows);

    // Record usage after successful generation (2 credits for deck generation)
    await recordUsageEvent(adminClient, user.id, 'deck_generation');

    console.log('[deck-generate] deck created', deck.id);

    return jsonResponse(deck, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Generation failed',
      500,
    );
  }
});
