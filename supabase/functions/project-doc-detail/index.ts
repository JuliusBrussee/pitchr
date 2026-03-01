// Edge Function: project-doc-detail
// Methods: GET (get document with blocks), DELETE (remove document), PATCH (update)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import {
  getDocument,
  getBlocksByDocumentId,
  deleteDocument,
  updateDocument,
} from '../_shared/project-document-service.ts';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

async function handleGet(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const documentId = url.searchParams.get('documentId');

  if (!documentId || !isUuid(documentId)) {
    return errorResponse('documentId query parameter must be a valid UUID.', 400);
  }

  const doc = await getDocument(supabase, documentId);
  if (!doc) {
    return errorResponse('Document not found.', 404);
  }
  if (doc.user_id !== user.id) {
    return errorResponse('Document not found.', 404);
  }

  const blocks = await getBlocksByDocumentId(supabase, documentId);

  return jsonResponse({ document: doc, blocks }, 200);
}

async function handleDelete(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const documentId = url.searchParams.get('documentId');

  if (!documentId || !isUuid(documentId)) {
    return errorResponse('documentId query parameter must be a valid UUID.', 400);
  }

  const doc = await getDocument(supabase, documentId);
  if (!doc) {
    return errorResponse('Document not found.', 404);
  }
  if (doc.user_id !== user.id) {
    return errorResponse('Document not found.', 404);
  }

  await deleteDocument(supabase, user.id, documentId);

  return jsonResponse({ deleted: true }, 200);
}

async function handlePatch(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const payload = body as Record<string, unknown>;
  const documentId = typeof payload.documentId === 'string' ? payload.documentId : undefined;

  if (!documentId || !isUuid(documentId)) {
    return errorResponse('documentId must be a valid UUID.', 400);
  }

  const doc = await getDocument(supabase, documentId);
  if (!doc) {
    return errorResponse('Document not found.', 404);
  }
  if (doc.user_id !== user.id) {
    return errorResponse('Document not found.', 404);
  }

  const updates: Record<string, unknown> = {};
  if (typeof payload.is_default_context === 'boolean') {
    updates.is_default_context = payload.is_default_context;
  }
  if (typeof payload.name === 'string' && payload.name.trim()) {
    updates.name = payload.name.trim();
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse(doc, 200);
  }

  const updated = await updateDocument(supabase, documentId, updates);
  return jsonResponse(updated, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'DELETE') return await handleDelete(req);
    if (req.method === 'PATCH') return await handlePatch(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Request failed',
      500,
    );
  }
});
