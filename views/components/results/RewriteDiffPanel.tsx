'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles, Minus, Plus, RefreshCw } from 'lucide-react';
import type { RewriteDiff, RewriteDiffHunk, RewriteDiffToken } from '@/types/analysis-v2';

interface RewriteDiffPanelProps {
  diff?: RewriteDiff;
}

function extractSideTokens(
  tokens: RewriteDiffToken[],
  side: 'original' | 'rewrite',
): RewriteDiffToken[] {
  return tokens.filter((t) => {
    if (side === 'original') return t.kind === 'context' || t.kind === 'remove';
    return t.kind === 'context' || t.kind === 'add';
  });
}

function HunkSplitView({
  hunk,
  index,
  hoveredHunk,
  onHover,
}: {
  hunk: RewriteDiffHunk;
  index: number;
  hoveredHunk: string | null;
  onHover: (id: string | null) => void;
}) {
  const originalTokens = extractSideTokens(hunk.tokens, 'original');
  const rewriteTokens = extractSideTokens(hunk.tokens, 'rewrite');
  const isHovered = hoveredHunk === hunk.id;

  return (
    <article
      className="rdp-hunk group"
      style={{
        animationDelay: `${index * 80}ms`,
        '--hunk-glow': isHovered ? '1' : '0',
      } as React.CSSProperties}
      onMouseEnter={() => onHover(hunk.id)}
      onMouseLeave={() => onHover(null)}
    >
      {hunk.summary ? (
        <div className="rdp-hunk-summary">
          <RefreshCw size={10} style={{ opacity: 0.5 }} />
          <span>{hunk.summary}</span>
        </div>
      ) : null}

      <div className="rdp-split-grid">
        {/* Original side */}
        <div className="rdp-side rdp-side--original">
          <div className="rdp-side-label">
            <Minus size={10} />
            <span>Before</span>
          </div>
          <div className="rdp-tokens">
            {originalTokens.map((token, i) => (
              <span
                key={`${hunk.id}-orig-${i}`}
                className={`rdp-token ${token.kind === 'remove' ? 'rdp-token--remove' : 'rdp-token--context'}`}
                title={token.grammar_tag ?? token.kind}
              >
                {token.value}
                {token.value.match(/[^\w]/u) ? '' : ' '}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="rdp-divider">
          <div className="rdp-divider-line" />
          <div className="rdp-divider-arrow">
            <ArrowRight size={10} />
          </div>
          <div className="rdp-divider-line" />
        </div>

        {/* Rewrite side */}
        <div className="rdp-side rdp-side--rewrite">
          <div className="rdp-side-label rdp-side-label--rewrite">
            <Plus size={10} />
            <span>After</span>
          </div>
          <div className="rdp-tokens">
            {rewriteTokens.map((token, i) => (
              <span
                key={`${hunk.id}-rw-${i}`}
                className={`rdp-token ${token.kind === 'add' ? 'rdp-token--add' : 'rdp-token--context'}`}
                title={token.grammar_tag ?? token.kind}
              >
                {token.value}
                {token.value.match(/[^\w]/u) ? '' : ' '}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function RewriteDiffPanel({ diff }: RewriteDiffPanelProps) {
  const [hoveredHunk, setHoveredHunk] = useState<string | null>(null);

  if (!diff) return null;

  const alignmentPct = Math.round(diff.alignment_score * 100);

  return (
    <section
      className="rdp-root results-card-enter"
      style={{ '--card-delay': '0ms' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="rdp-header">
        <div className="rdp-header-left">
          <div className="rdp-header-icon">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="rdp-title">Script Rewrite</h3>
            <p className="rdp-subtitle">Side-by-side comparison</p>
          </div>
        </div>

        <div className="rdp-stats">
          <span className="rdp-stat rdp-stat--removed">
            <Minus size={9} strokeWidth={2.5} />
            {diff.stats.removed}
          </span>
          <span className="rdp-stat rdp-stat--added">
            <Plus size={9} strokeWidth={2.5} />
            {diff.stats.added}
          </span>
          <span className="rdp-stat rdp-stat--changed">
            {diff.stats.changed} changed
          </span>
          {alignmentPct > 0 ? (
            <span className="rdp-stat rdp-stat--alignment">
              {alignmentPct}% aligned
            </span>
          ) : null}
        </div>
      </div>

      {/* Hunks */}
      <div className="rdp-hunks">
        {diff.hunks.map((hunk, index) => (
          <HunkSplitView
            key={hunk.id}
            hunk={hunk}
            index={index}
            hoveredHunk={hoveredHunk}
            onHover={setHoveredHunk}
          />
        ))}
      </div>
    </section>
  );
}
