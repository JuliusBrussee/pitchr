'use client';

import { useCallback, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Type,
  FileCheck,
} from 'lucide-react';
import { useProjectDocuments } from '@/hooks/useProjectDocuments';
import type { ProjectDocument } from '@/types/project';

interface ContextSourcesManagerProps {
  projectId: string | null;
}

function StatusBadge({ status }: { status: ProjectDocument['status'] }) {
  const config = {
    processing: { label: 'Processing', color: '#f59e0b' },
    ready: { label: 'Ready', color: '#22c55e' },
    failed: { label: 'Failed', color: '#ef4444' },
  }[status];

  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: config.color, backgroundColor: `${config.color}1a` }}
    >
      {config.label}
    </span>
  );
}

function SourceTypeIcon({ type }: { type: ProjectDocument['sourceType'] }) {
  if (type === 'word_doc') return <FileText size={14} />;
  return <Type size={14} />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContextSourcesManager({ projectId }: ContextSourcesManagerProps) {
  const {
    documents,
    isLoading,
    error,
    uploadDocx,
    pasteText,
    toggleDefaultContext,
    deleteDocument,
  } = useProjectDocuments(projectId);

  const [isUploading, setIsUploading] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [pasteName, setPasteName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setActionError(null);
    try {
      await uploadDocx(file);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploadDocx]);

  const handlePaste = useCallback(async () => {
    if (!pasteName.trim() || !pasteContent.trim()) return;

    setIsPasting(true);
    setActionError(null);
    try {
      await pasteText(pasteName.trim(), pasteContent.trim());
      setPasteName('');
      setPasteContent('');
      setShowPasteForm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save text.');
    } finally {
      setIsPasting(false);
    }
  }, [pasteName, pasteContent, pasteText]);

  const handleToggleDefault = useCallback(async (doc: ProjectDocument) => {
    setActionError(null);
    try {
      await toggleDefaultContext(doc.id, !doc.isDefaultContext);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update.');
    }
  }, [toggleDefaultContext]);

  const handleDelete = useCallback(async (doc: ProjectDocument) => {
    setActionError(null);
    try {
      await deleteDocument(doc.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  }, [deleteDocument]);

  if (!projectId) {
    return (
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Select a project to manage context sources.
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border p-4"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-surface-hover)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FileCheck size={16} style={{ color: 'var(--text-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Context Sources
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPasteForm(!showPasteForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Type size={12} />
            Paste text
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: '#ff5941',
              color: 'white',
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload DOCX
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Upload Word docs or paste text to provide context for pitch scoring. Sources marked as default will
        automatically be included in new runs.
      </p>

      {showPasteForm ? (
        <div
          className="rounded-lg border p-3 mb-3 flex flex-col gap-2"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <input
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
            placeholder="Document name"
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste your text content here..."
            rows={5}
            className="rounded-lg border px-3 py-2 text-sm resize-y"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowPasteForm(false);
                setPasteName('');
                setPasteContent('');
              }}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPasting || !pasteName.trim() || !pasteContent.trim()}
              onClick={handlePaste}
              className="rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: '#ff5941',
                color: 'white',
                opacity: isPasting || !pasteName.trim() || !pasteContent.trim() ? 0.7 : 1,
              }}
            >
              {isPasting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? (
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2 mb-3 text-xs"
          style={{
            borderColor: 'rgba(239,68,68,0.25)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={12} />
          {actionError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm py-4 justify-center" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={14} className="animate-spin" />
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No context sources yet. Upload a DOCX or paste text to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <SourceTypeIcon type={doc.sourceType} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {doc.name}
                  </span>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {doc.sourceType === 'word_doc' ? 'DOCX' : 'Text'}
                  {doc.fileSizeBytes ? ` \u00B7 ${formatFileSize(doc.fileSizeBytes)}` : ''}
                  {doc.blockCount > 0 ? ` \u00B7 ${doc.blockCount} blocks` : ''}
                  {doc.errorMessage ? ` \u00B7 ${doc.errorMessage}` : ''}
                </div>
              </div>
              <button
                type="button"
                title={doc.isDefaultContext ? 'Included by default' : 'Not included by default'}
                onClick={() => void handleToggleDefault(doc)}
                className="shrink-0"
                style={{ color: doc.isDefaultContext ? '#22c55e' : 'var(--text-muted)' }}
              >
                {doc.isDefaultContext ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button
                type="button"
                title="Delete document"
                onClick={() => void handleDelete(doc)}
                className="shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
