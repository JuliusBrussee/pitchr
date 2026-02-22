'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { SectionFeedback } from '@/types/analysis-v2';

interface SectionAccordionProps {
  sections?: SectionFeedback[];
}

const BEAT_LABELS: Record<string, string> = {
  intro: 'Introduction',
  problem: 'Problem',
  solution: 'Solution',
  market: 'Market',
  model: 'Business Model',
  traction: 'Traction',
  team: 'Team',
  ask: 'The Ask',
};

const SCORE_COLORS: Record<number, string> = {
  0: '#ef4444',
  1: '#ef4444',
  2: '#f97316',
  3: '#ffaa33',
  4: '#3b82f6',
  5: '#22c55e',
};

export function SectionAccordion({ sections }: SectionAccordionProps) {
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const entries = sections ?? [];

  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-5 results-card-enter"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        '--card-delay': '0ms',
      } as React.CSSProperties}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Pitch Beats
      </h3>
      <div className="space-y-1">
        {entries.map((section, index) => {
          const isOpen = openBeat === section.beat;
          const scoreColor = SCORE_COLORS[Math.min(5, Math.max(0, section.score))] ?? '#ffaa33';

          return (
            <article
              key={`${section.beat}-${index}`}
              className="rounded-lg overflow-hidden transition-colors duration-150"
              style={{
                backgroundColor: isOpen ? 'var(--bg-surface-hover)' : 'transparent',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenBeat((prev) => (prev === section.beat ? null : section.beat))}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                  }}
                />
                <span className="font-medium text-sm flex-1">
                  {BEAT_LABELS[section.beat] ?? section.beat}
                </span>
                {/* Score bar inline */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${scoreColor}1a` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(section.score / 5) * 100}%`,
                        backgroundColor: scoreColor,
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold tabular-nums w-6 text-right"
                    style={{ color: scoreColor }}
                  >
                    {section.score}/5
                  </span>
                </div>
              </button>

              <div className="results-accordion-content" data-open={isOpen}>
                <div className="results-accordion-inner">
                  <div className="px-3 pb-3 pt-0.5 space-y-2">
                    {/* Score reason as a brief summary */}
                    {section.score_reason ? (
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {section.score_reason}
                      </p>
                    ) : null}

                    {/* Good / Bad as compact inline chips */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-start gap-1.5 text-xs leading-relaxed">
                        <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{section.good}</span>
                      </div>
                      <div className="flex-1 flex items-start gap-1.5 text-xs leading-relaxed">
                        <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{section.bad}</span>
                      </div>
                    </div>

                    {/* Top fix if available - just the most actionable one */}
                    {section.top_fixes.length > 0 ? (
                      <p className="text-xs leading-relaxed pl-3 border-l-2" style={{ color: 'var(--text-secondary)', borderColor: '#22c55e' }}>
                        {section.top_fixes[0]}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
