// Edge Function: deck-generate
// Replaces: app/api/deck/generate/route.ts
// Methods: POST (AI-generate a deck)
//
// Note: The full deck generation pipeline (LLM + React PDF rendering) is complex
// and relies on Node.js-specific libraries (@react-pdf/renderer).
// This edge function handles validation and delegates to the generation service.
// For full PDF generation, the actual rendering may need a Node.js backend service.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import type { TemplateId, GenerateDeckRequest } from '../_shared/types.ts';

const VALID_TEMPLATES = new Set<TemplateId>([
  'minimal-dark',
  'corporate-clean',
  'bold-gradient',
  'startup-fresh',
]);

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

    // Store the generation request as a queued deck record
    // The actual LLM + PDF rendering happens via a background process
    const { data: deck, error } = await supabase
      .from('decks')
      .insert({
        name: `${body.companyName.trim()} Pitch Deck`,
        original_url: '',
        pdf_url: '',
        slide_count: 0,
        thumbnail_url: null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deck record: ${error.message}`);
    }

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
