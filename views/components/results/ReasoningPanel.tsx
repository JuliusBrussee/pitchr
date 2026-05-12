'use client';

import { useState } from 'react';
import { ChevronDown, Brain } from 'lucide-react';
import type { Citation, FeedbackOutput } from '@/types/analysis-v2';

interface ReasoningPanelProps {
  reasoning?: FeedbackOutput['advanced_reasoning'];
  citations?: Citation[];
}

export function ReasoningPanel({ reasoning, citations }: ReasoningPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rows = citations ?? [];
  if (!reasoning && rows.length === 0) return null;

  return (
    <section
      className="rounded-2xl border overflow-hidden results-card-enter"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        '--card-delay': '0ms',
      } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            AI Reasoning
          </span>
          {reasoning ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded tabular-nums"
              style={{
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              {Math.round(reasoning.confidence * 100)}% conf.
            </span>
          ) : null}
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      <div className="results-accordion-content" data-open={isOpen}>
        <div className="results-accordion-inner">
          <div className="px-5 pb-5 space-y-4">
            {reasoning ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Score Logic
                  </p>
                  <ul className="space-y-1.5">
                    {reasoning.score_logic.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'rgba(34,197,94,0.04)' }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#22c55e' }}
                  >
                    Strong Signals
                  </p>
                  <ul className="space-y-1.5">
                    {reasoning.strongest_signals.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'rgba(239,68,68,0.04)' }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#ef4444' }}
                  >
                    Weak Signals
                  </p>
                  <ul className="space-y-1.5">
                    {reasoning.weakest_signals.map((item) => (
                      <li
                        key={item}
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {rows.length > 0 ? (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Citations
                </p>
                <div className="space-y-2">
                  {rows.slice(0, 4).map((citation) => (
                    <div key={citation.source_id} className="flex items-start gap-2">
                      <span
                        className="shrink-0 mt-1.5 w-1 h-1 rounded-full"
                        style={{ backgroundColor: '#ff5941' }}
                      />
                      <div>
                        <a
                          href={citation.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm no-underline hover:underline"
                          style={{ color: '#ff5941' }}
                        >
                          {citation.source_title || citation.source_id}
                        </a>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {citation.excerpt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
