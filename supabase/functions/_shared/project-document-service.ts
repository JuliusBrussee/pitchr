// Shared service for project document operations (DOCX, pasted text).
// Handles CRUD, storage, and block retrieval for context sources.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentSourceType = 'word_doc' | 'plain_text';
export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface ProjectDocumentRecord {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  source_type: DocumentSourceType;
  status: DocumentStatus;
  error_message: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  is_default_context: boolean;
  block_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocumentBlockRecord {
  id: string;
  document_id: string;
  project_id: string;
  block_index: number;
  block_text: string;
  locator: BlockLocator;
  word_count: number;
  created_at: string;
}

export interface BlockLocator {
  type: 'paragraph' | 'heading' | 'page' | 'text_chunk';
  page?: number;
  paragraph?: number;
  heading_level?: number;
  heading_text?: string;
  block_id?: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function uploadDocumentToStorage(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  fileName: string,
  buffer: Uint8Array,
  contentType: string,
): Promise<string> {
  const filePath = `${userId}/${documentId}/${fileName}`;

  const { error } = await supabase.storage
    .from('project-documents')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Document storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from('project-documents').getPublicUrl(filePath);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Document CRUD
// ---------------------------------------------------------------------------

export async function insertDocument(
  supabase: SupabaseClient,
  doc: {
    project_id: string;
    user_id: string;
    name: string;
    source_type: DocumentSourceType;
    status?: DocumentStatus;
    file_url?: string;
    file_size_bytes?: number;
    is_default_context?: boolean;
  },
): Promise<ProjectDocumentRecord> {
  const { data, error } = await supabase
    .from('project_documents')
    .insert({
      project_id: doc.project_id,
      user_id: doc.user_id,
      name: doc.name,
      source_type: doc.source_type,
      status: doc.status ?? 'processing',
      file_url: doc.file_url ?? null,
      file_size_bytes: doc.file_size_bytes ?? null,
      is_default_context: doc.is_default_context ?? true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert document: ${error?.message ?? 'unknown error'}`);
  }
  return data as ProjectDocumentRecord;
}

export async function updateDocument(
  supabase: SupabaseClient,
  documentId: string,
  updates: Partial<Pick<
    ProjectDocumentRecord,
    'status' | 'error_message' | 'block_count' | 'is_default_context' | 'name'
  >>,
): Promise<ProjectDocumentRecord> {
  const { data, error } = await supabase
    .from('project_documents')
    .update(updates)
    .eq('id', documentId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update document: ${error?.message ?? 'unknown error'}`);
  }
  return data as ProjectDocumentRecord;
}

export async function listDocuments(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectDocumentRecord[]> {
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list documents: ${error.message}`);
  return (data ?? []) as ProjectDocumentRecord[];
}

export async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
): Promise<ProjectDocumentRecord | null> {
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get document: ${error.message}`);
  return data as ProjectDocumentRecord | null;
}

export async function deleteDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  // Delete storage files first
  const { data: files } = await supabase.storage
    .from('project-documents')
    .list(`${userId}/${documentId}`);

  if (files && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${userId}/${documentId}/${f.name}`);
    await supabase.storage.from('project-documents').remove(paths);
  }

  // Delete DB record (blocks cascade via FK)
  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Block operations
// ---------------------------------------------------------------------------

export async function insertBlocks(
  supabase: SupabaseClient,
  documentId: string,
  projectId: string,
  blocks: Array<{
    block_index: number;
    block_text: string;
    locator: BlockLocator;
    word_count: number;
  }>,
): Promise<void> {
  if (blocks.length === 0) return;

  const rows = blocks.map((b) => ({
    document_id: documentId,
    project_id: projectId,
    block_index: b.block_index,
    block_text: b.block_text,
    locator: b.locator,
    word_count: b.word_count,
  }));

  // Insert in batches of 100 to avoid payload limits
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('project_document_blocks').insert(batch);
    if (error) throw new Error(`Failed to insert blocks (batch ${i}): ${error.message}`);
  }
}

export async function getBlocksByDocumentId(
  supabase: SupabaseClient,
  documentId: string,
): Promise<ProjectDocumentBlockRecord[]> {
  const { data, error } = await supabase
    .from('project_document_blocks')
    .select('*')
    .eq('document_id', documentId)
    .order('block_index', { ascending: true });

  if (error) throw new Error(`Failed to get blocks: ${error.message}`);
  return (data ?? []) as ProjectDocumentBlockRecord[];
}

// ---------------------------------------------------------------------------
// Retrieval: get relevant blocks for analysis context
// ---------------------------------------------------------------------------

export async function getDefaultContextDocumentIds(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('project_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_default_context', true)
    .eq('status', 'ready');

  if (error) throw new Error(`Failed to get default context docs: ${error.message}`);
  return (data ?? []).map((d: { id: string }) => d.id);
}

export async function getContextBlocks(
  supabase: SupabaseClient,
  documentIds: string[],
  opts?: { maxBlocks?: number },
): Promise<ProjectDocumentBlockRecord[]> {
  if (documentIds.length === 0) return [];

  const maxBlocks = opts?.maxBlocks ?? 50;

  const { data, error } = await supabase
    .from('project_document_blocks')
    .select('*')
    .in('document_id', documentIds)
    .order('block_index', { ascending: true })
    .limit(maxBlocks);

  if (error) throw new Error(`Failed to get context blocks: ${error.message}`);
  return (data ?? []) as ProjectDocumentBlockRecord[];
}

/**
 * Search blocks by text relevance using Postgres full-text search.
 * Returns top matching blocks across the given documents.
 */
export async function searchBlocks(
  supabase: SupabaseClient,
  documentIds: string[],
  query: string,
  opts?: { limit?: number },
): Promise<ProjectDocumentBlockRecord[]> {
  if (documentIds.length === 0 || !query.trim()) return [];

  const limit = opts?.limit ?? 20;
  // Use Postgres ts_rank for relevance ordering
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.replace(/[^\w]/g, ''))
    .filter(Boolean)
    .join(' | ');

  if (!tsQuery) return [];

  const { data, error } = await supabase
    .rpc('search_document_blocks', {
      p_document_ids: documentIds,
      p_query: tsQuery,
      p_limit: limit,
    });

  // If RPC doesn't exist, fall back to simple text match
  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('project_document_blocks')
      .select('*')
      .in('document_id', documentIds)
      .textSearch('block_text', tsQuery, { type: 'websearch' })
      .limit(limit);

    if (fallbackError) {
      console.warn('[project-document-service] search fallback failed:', fallbackError.message);
      return [];
    }
    return (fallbackData ?? []) as ProjectDocumentBlockRecord[];
  }

  return (data ?? []) as ProjectDocumentBlockRecord[];
}
