// Edge Function: project-doc-upload
// Methods: POST (upload DOCX or paste text as project context document)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { resolveProjectForRequest, ProjectNotFoundError } from '../_shared/project-service.ts';
import {
  insertDocument,
  updateDocument,
  uploadDocumentToStorage,
  insertBlocks,
} from '../_shared/project-document-service.ts';
import { extractDocxText, chunkPlainText } from '../_shared/document-chunking.ts';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_TEXT_LENGTH = 500_000; // ~500K characters for pasted text

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

async function handleDocxUpload(
  supabase: ReturnType<typeof getAuthenticatedUser> extends Promise<infer U> ? (U extends { supabase: infer S } ? S : never) : never,
  userId: string,
  projectId: string,
  file: File,
): Promise<Response> {
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse('File too large. Maximum size is 50MB.', 400);
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const docName = file.name.replace(/\.docx$/i, '');

  // Insert document record in processing state
  const doc = await insertDocument(supabase, {
    project_id: projectId,
    user_id: userId,
    name: docName,
    source_type: 'word_doc',
    status: 'processing',
    file_size_bytes: file.size,
  });

  try {
    // Upload file to storage
    const fileUrl = await uploadDocumentToStorage(
      supabase,
      userId,
      doc.id,
      'original.docx',
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    // Extract text blocks from DOCX
    const blocks = await extractDocxText(buffer);

    if (blocks.length === 0) {
      const updated = await updateDocument(supabase, doc.id, {
        status: 'failed',
        error_message: 'No text content could be extracted from the DOCX file.',
      });
      return jsonResponse(updated, 201);
    }

    // Insert blocks
    await insertBlocks(supabase, doc.id, projectId, blocks);

    // Update document status
    const updated = await updateDocument(supabase, doc.id, {
      status: 'ready',
      block_count: blocks.length,
    });

    // Also update file_url (needs separate update since insertDocument already returned)
    await supabase
      .from('project_documents')
      .update({ file_url: fileUrl })
      .eq('id', doc.id);

    return jsonResponse({ ...updated, file_url: fileUrl }, 201);
  } catch (extractionError) {
    const message = extractionError instanceof Error
      ? extractionError.message
      : 'Document processing failed.';

    console.error('[project-doc-upload] extraction failed', { documentId: doc.id, error: message });

    const updated = await updateDocument(supabase, doc.id, {
      status: 'failed',
      error_message: message,
    });

    return jsonResponse(updated, 201);
  }
}

async function handleTextPaste(
  supabase: ReturnType<typeof getAuthenticatedUser> extends Promise<infer U> ? (U extends { supabase: infer S } ? S : never) : never,
  userId: string,
  projectId: string,
  name: string,
  text: string,
): Promise<Response> {
  if (text.length > MAX_TEXT_LENGTH) {
    return errorResponse(`Text too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`, 400);
  }

  // Insert document record
  const doc = await insertDocument(supabase, {
    project_id: projectId,
    user_id: userId,
    name,
    source_type: 'plain_text',
    status: 'processing',
  });

  try {
    const blocks = chunkPlainText(text);

    if (blocks.length === 0) {
      const updated = await updateDocument(supabase, doc.id, {
        status: 'failed',
        error_message: 'No text content found after processing.',
      });
      return jsonResponse(updated, 201);
    }

    await insertBlocks(supabase, doc.id, projectId, blocks);

    const updated = await updateDocument(supabase, doc.id, {
      status: 'ready',
      block_count: blocks.length,
    });

    return jsonResponse(updated, 201);
  } catch (chunkError) {
    const message = chunkError instanceof Error
      ? chunkError.message
      : 'Text processing failed.';

    const updated = await updateDocument(supabase, doc.id, {
      status: 'failed',
      error_message: message,
    });

    return jsonResponse(updated, 201);
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      // DOCX file upload
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawProjectId = formData.get('projectId');
      const projectId = typeof rawProjectId === 'string' && rawProjectId.trim().length > 0
        ? rawProjectId.trim()
        : undefined;

      if (projectId && !isUuid(projectId)) {
        return errorResponse('projectId must be a valid UUID.', 400);
      }

      const project = await resolveProjectForRequest(supabase, user.id, { projectId });

      if (!file) {
        return errorResponse('No file provided.', 400);
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'docx') {
        return errorResponse('Only DOCX files are accepted for document upload.', 400);
      }

      // deno-lint-ignore no-explicit-any
      return await handleDocxUpload(supabase as any, user.id, project.id, file);
    }

    // JSON body — text paste
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body.', 400);
    }

    const payload = body as Record<string, unknown>;

    if (typeof payload.text !== 'string' || !payload.text.trim()) {
      return errorResponse('text field is required and must be non-empty.', 400);
    }
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      return errorResponse('name field is required.', 400);
    }

    const projectId = typeof payload.projectId === 'string' ? payload.projectId.trim() : undefined;
    if (projectId && !isUuid(projectId)) {
      return errorResponse('projectId must be a valid UUID.', 400);
    }

    const project = await resolveProjectForRequest(supabase, user.id, { projectId });

    // deno-lint-ignore no-explicit-any
    return await handleTextPaste(supabase as any, user.id, project.id, payload.name.trim(), payload.text.trim());
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Upload failed',
      500,
    );
  }
});
