'use client';

import type { RewriteDiff, RewriteDiffToken } from '@/types/analysis-v2';

interface RewriteDiffPanelProps {
  diff?: RewriteDiff;
}

function tokenStyle(token: RewriteDiffToken): { color: string; background?: string; textDecoration?: string } {
  if (token.kind === 'add') {
    return {
      color: '#15803d',
      background: 'rgba(34,197,94,0.15)',
    };
  }
  if (token.kind === 'remove') {
    return {
      color: '#b91c1c',
      background: 'rgba(239,68,68,0.15)',
      textDecoration: 'line-through',
    };
  }
  return { color: 'var(--text-secondary)' };
}

export function RewriteDiffPanel({ diff }: RewriteDiffPanelProps) {
  if (!diff) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Transcript vs Rewrite Diff
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          +{diff.stats.added} / -{diff.stats.removed} | Changed {diff.stats.changed}
        </p>
      </div>
      <div className="space-y-3 max-h-[24rem] overflow-y-auto pr-1">
        {diff.hunks.map((hunk) => (
          <article
            key={hunk.id}
            className="rounded-xl border p-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {hunk.summary ? (
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {hunk.summary}
              </p>
            ) : null}
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {hunk.tokens.map((token, index) => (
                <span
                  key={`${hunk.id}-${index}-${token.value}`}
                  className="px-[1px] rounded-sm"
                  style={tokenStyle(token)}
                  title={token.grammar_tag ?? token.kind}
                >
                  {token.value}
                  {token.value.match(/[^\w]/u) ? '' : ' '}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
