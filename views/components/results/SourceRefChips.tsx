'use client';

import { FileText, Image } from 'lucide-react';
import type { SourceReference } from '@/types/analysis-v2';

interface SourceRefChipsProps {
  refs?: SourceReference[];
}

/**
 * Renders small source reference chips under rubric rows or fixes.
 * Only renders when refs exist and are non-empty.
 */
export function SourceRefChips({ refs }: SourceRefChipsProps) {
  if (!refs || refs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {refs.map((ref, i) => (
        <span
          key={`${ref.source_id}-${ref.block_id ?? ref.slide_num ?? i}`}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium"
          style={{
            backgroundColor: ref.relevance === 'high'
              ? 'rgba(255,89,65,0.1)'
              : ref.relevance === 'medium'
                ? 'rgba(255,170,51,0.1)'
                : 'var(--bg-surface-hover)',
            color: ref.relevance === 'high'
              ? '#ff5941'
              : ref.relevance === 'medium'
                ? '#ffaa33'
                : 'var(--text-muted)',
          }}
          title={ref.snippet}
        >
          {ref.source_type === 'slide' ? (
            <Image size={8} />
          ) : (
            <FileText size={8} />
          )}
          {ref.source_name}
          {ref.slide_num ? ` #${ref.slide_num}` : ''}
        </span>
      ))}
    </div>
  );
}
