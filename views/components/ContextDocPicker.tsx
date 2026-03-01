'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { ProjectDocument } from '@/types/project';

interface ContextDocPickerProps {
  documents: ProjectDocument[];
  isLoading: boolean;
  selectedIds: string[] | undefined;
  onChange: (ids: string[] | undefined) => void;
}

/**
 * Compact picker for selecting which context documents to include in a pitch run.
 * undefined = use project defaults, [] = no docs, [...] = specific docs.
 */
export function ContextDocPicker({
  documents,
  isLoading,
  selectedIds,
  onChange,
}: ContextDocPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const readyDocs = documents.filter((d) => d.status === 'ready');
  const defaultDocs = readyDocs.filter((d) => d.isDefaultContext);

  // Which IDs are effectively selected
  const effectiveIds = selectedIds === undefined
    ? defaultDocs.map((d) => d.id)
    : selectedIds;

  const selectedCount = effectiveIds.length;
  const isUsingDefaults = selectedIds === undefined;

  const handleToggle = useCallback((docId: string) => {
    const currentIds = selectedIds === undefined
      ? defaultDocs.map((d) => d.id)
      : [...selectedIds];

    if (currentIds.includes(docId)) {
      onChange(currentIds.filter((id) => id !== docId));
    } else {
      onChange([...currentIds, docId]);
    }
  }, [selectedIds, defaultDocs, onChange]);

  const handleResetToDefaults = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  if (readyDocs.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
        style={{
          borderColor: selectedCount > 0 ? 'rgba(255,89,65,0.3)' : 'var(--border-color)',
          color: selectedCount > 0 ? '#ff5941' : 'var(--text-secondary)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <FileText size={12} />
        Context {selectedCount > 0 ? `(${selectedCount})` : ''}
        {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {isOpen ? (
        <div
          className="absolute top-full left-0 mt-1 z-50 rounded-lg border shadow-lg p-2 min-w-[220px] max-w-[300px]"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {readyDocs.length === 0 ? (
            <p className="text-xs py-2 px-1" style={{ color: 'var(--text-muted)' }}>
              No context documents available.
            </p>
          ) : (
            <>
              {readyDocs.map((doc) => {
                const isSelected = effectiveIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleToggle(doc.id)}
                    className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs text-left"
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: isSelected ? 'rgba(255,89,65,0.08)' : 'transparent',
                    }}
                  >
                    <span
                      className="shrink-0 w-4 h-4 rounded border flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? '#ff5941' : 'var(--border-color)',
                        backgroundColor: isSelected ? '#ff5941' : 'transparent',
                      }}
                    >
                      {isSelected ? <Check size={10} color="white" /> : null}
                    </span>
                    <span className="truncate flex-1">{doc.name}</span>
                    {doc.isDefaultContext ? (
                      <span
                        className="text-[9px] px-1 rounded"
                        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-hover)' }}
                      >
                        default
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!isUsingDefaults ? (
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="w-full text-left rounded px-2 py-1.5 text-xs mt-1 border-t"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Reset to project defaults
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
