'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SectionFeedback } from '@/types/analysis-v2';

interface SectionAccordionProps {
  sections?: SectionFeedback[];
}

function formatTime(value: number): string {
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function SectionAccordion({ sections }: SectionAccordionProps) {
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const entries = sections ?? [];

  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Pitch Beat Feedback
      </h3>
      <div className="space-y-2">
        {entries.map((section, index) => {
          const isOpen = openBeat === section.beat;
          return (
            <article
              key={`${section.beat}-${index}`}
              className="rounded-xl border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                type="button"
                onClick={() => setOpenBeat((prev) => (prev === section.beat ? null : section.beat))}
                className="w-full px-3 py-2 flex items-center justify-between text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="font-medium">
                  {section.beat}
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatTime(section.start_sec)} - {formatTime(section.end_sec)}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 180ms ease',
                  }}
                />
              </button>

              {isOpen ? (
                <div className="px-3 pb-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#22c55e' }}>
                      Good
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {section.good}
                    </p>
                  </div>
                  <div className="rounded-lg border p-2" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#ef4444' }}>
                      Bad
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {section.bad}
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Evidence
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {section.evidence}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Top Issues
                    </p>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      {section.top_issues.map((issue) => (
                        <li key={issue}>- {issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Top Fixes
                    </p>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                      {section.top_fixes.map((fix) => (
                        <li key={fix}>- {fix}</li>
                      ))}
                    </ul>
                  </div>
                  {(section.slide_links ?? []).length > 0 ? (
                    <div className="lg:col-span-2">
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                        Linked Slides
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(section.slide_links ?? []).map((slide) => (
                          <span
                            key={`${section.beat}-slide-${slide.slide_num}`}
                            className="text-xs px-2 py-1 rounded-full border"
                            style={{
                              color: 'var(--text-secondary)',
                              borderColor: 'rgba(255,170,51,0.4)',
                              backgroundColor: 'rgba(255,170,51,0.08)',
                            }}
                          >
                            Slide {slide.slide_num} ({Math.round(slide.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
