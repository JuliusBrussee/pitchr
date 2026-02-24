// Edge Function: deck-upload
// Replaces: app/api/deck/upload/route.ts
// Methods: POST (upload deck file)
//
// Note: PPTX→PDF conversion via LibreOffice is not available in edge functions.
// Only PDF uploads are supported. PPTX conversion should be handled client-side
// or via a separate Node.js service.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import {
  uploadToStorage,
  insertDeck,
  insertSlides,
} from '../_shared/deck-service.ts';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.pptx']);

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return errorResponse('Invalid file type. Only .pptx and .pdf files are accepted.', 400);
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size is 50MB.', 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const isPptx = ext === '.pptx';

    if (isPptx) {
      return errorResponse(
        'PPTX conversion is not supported in edge functions. Please upload a PDF instead.',
        422,
      );
    }

    // For PDF, we skip text extraction in edge functions
    // (pdf-parse requires Node.js). Store the file and create a basic deck record.
    const tempId = crypto.randomUUID();

    const originalUrl = await uploadToStorage(
      supabase,
      user.id,
      tempId,
      `original${ext}`,
      buffer,
      file.type || 'application/pdf',
    );

    // Insert deck record
    const deckName = file.name.replace(/\.(pptx|pdf)$/i, '');
    const deck = await insertDeck(supabase, {
      name: deckName,
      original_url: originalUrl,
      pdf_url: originalUrl,
      slide_count: 0,
      thumbnail_url: null,
    });

    // Insert a single slide placeholder since we can't extract pages in Deno
    await insertSlides(supabase, deck.id, [
      { slideNum: 1, text: '(Text extraction pending — uploaded via edge function)' },
    ]);

    return jsonResponse(deck, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Upload failed',
      500,
    );
  }
});
