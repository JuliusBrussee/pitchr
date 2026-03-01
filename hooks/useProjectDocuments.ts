'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { getEdgeErrorMessage, type EdgeErrorPayload } from '@/lib/supabase/edge-error';
import type { ProjectDocument } from '@/types/project';

interface ProjectDocumentsListResponse {
  documents?: Array<{
    id: string;
    project_id: string;
    name: string;
    source_type: 'word_doc' | 'plain_text';
    status: 'processing' | 'ready' | 'failed';
    error_message: string | null;
    file_url: string | null;
    file_size_bytes: number | null;
    is_default_context: boolean;
    block_count: number;
    created_at: string;
    updated_at: string;
  }>;
  projectId?: string;
}

function toProjectDocument(raw: NonNullable<ProjectDocumentsListResponse['documents']>[number]): ProjectDocument {
  return {
    id: raw.id,
    projectId: raw.project_id,
    name: raw.name,
    sourceType: raw.source_type,
    status: raw.status,
    errorMessage: raw.error_message,
    fileUrl: raw.file_url,
    fileSizeBytes: raw.file_size_bytes,
    isDefaultContext: raw.is_default_context,
    blockCount: raw.block_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

async function readPayload<T>(response: Response): Promise<T & EdgeErrorPayload> {
  return await response.json().catch(() => ({})) as T & EdgeErrorPayload;
}

export function useProjectDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchEdge('project-doc-list', {
        params: { projectId },
      });
      const payload = await readPayload<ProjectDocumentsListResponse>(response);
      if (!response.ok) {
        throw new Error(getEdgeErrorMessage(payload, 'Failed to load documents.'));
      }
      setDocuments((payload.documents ?? []).map(toProjectDocument));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadDocx = useCallback(async (file: File) => {
    if (!projectId) throw new Error('No active project.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const response = await fetchEdge('project-doc-upload', {
      method: 'POST',
      body: formData,
    });
    const payload = await readPayload<Record<string, unknown>>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to upload document.'));
    }
    await refresh();
  }, [projectId, refresh]);

  const pasteText = useCallback(async (name: string, text: string) => {
    if (!projectId) throw new Error('No active project.');
    const response = await fetchEdge('project-doc-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name, text }),
    });
    const payload = await readPayload<Record<string, unknown>>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to save text document.'));
    }
    await refresh();
  }, [projectId, refresh]);

  const toggleDefaultContext = useCallback(async (documentId: string, isDefault: boolean) => {
    const response = await fetchEdge('project-doc-detail', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, is_default_context: isDefault }),
    });
    const payload = await readPayload<Record<string, unknown>>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to update document.'));
    }
    await refresh();
  }, [refresh]);

  const deleteDocument = useCallback(async (documentId: string) => {
    const response = await fetchEdge('project-doc-detail', {
      method: 'DELETE',
      params: { documentId },
    });
    const payload = await readPayload<Record<string, unknown>>(response);
    if (!response.ok) {
      throw new Error(getEdgeErrorMessage(payload, 'Failed to delete document.'));
    }
    await refresh();
  }, [refresh]);

  return {
    documents,
    isLoading,
    error,
    refresh,
    uploadDocx,
    pasteText,
    toggleDefaultContext,
    deleteDocument,
  };
}
