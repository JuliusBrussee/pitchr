'use client';

import type { Citation, FeedbackOutput } from '@/types/analysis-v2';

interface ReasoningPanelProps {
  reasoning?: FeedbackOutput['advanced_reasoning'];
  citations?: Citation[];
}

export function ReasoningPanel({ reasoning, citations }: ReasoningPanelProps) {
  const rows = citations ?? [];
  if (!reasoning && rows.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Advanced Reasoning
      </h3>
      {reasoning ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          <div className="rounded-lg border p-2" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Score Logic
            </p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {reasoning.score_logic.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>
            <p className="text-xs mb-1" style={{ color: '#22c55e' }}>
              Strong Signals
            </p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {reasoning.strongest_signals.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
            <p className="text-xs mb-1" style={{ color: '#ef4444' }}>
              Weak Signals
            </p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {reasoning.weakest_signals.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="rounded-lg border p-2" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Citations
          </p>
          <div className="space-y-2">
            {rows.slice(0, 4).map((citation) => (
              <div key={citation.source_id}>
                <a
                  href={citation.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm no-underline"
                  style={{ color: '#ff5941' }}
                >
                  {citation.source_title || citation.source_id}
                </a>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {citation.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
