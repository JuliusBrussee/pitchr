// Edge Function: deck-generate
// Methods: POST (AI-generate a pitch deck from company description)
//
// Calls Claude API to generate 8 slide contents, inserts them into the DB.
// No PDF rendering — slides are stored as text in the slides table.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { insertDeck, insertSlides } from '../_shared/deck-service.ts';
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

interface ClaudeResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
}

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
): Promise<Array<{ title: string; bullets: string[] }>> {
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
    const slides = parsed.slides.slice(0, 8).map(
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

function formatSlideText(slide: { title: string; bullets: string[] }): string {
  const lines = [slide.title, ''];
  for (const bullet of slide.bullets) {
    lines.push(`- ${bullet}`);
  }
  return lines.join('\n');
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const body = await req.json() as Partial<GenerateDeckRequest>;

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
    if (!body.templateId || !VALID_TEMPLATES.has(body.templateId as TemplateId)) {
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

    // Insert deck record
    const deck = await insertDeck(supabase, {
      name: `${companyName} Pitch Deck`,
      original_url: '',
      pdf_url: '',
      slide_count: slides.length,
      thumbnail_url: null,
      user_id: user.id,
    });

    // Insert slide records
    const slideRows = slides.map((slide, i) => ({
      slideNum: i + 1,
      text: formatSlideText(slide),
    }));
    await insertSlides(supabase, deck.id, slideRows);

    console.log('[deck-generate] deck created', deck.id);

    return jsonResponse(deck, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Generation failed',
      500,
    );
  }
});
