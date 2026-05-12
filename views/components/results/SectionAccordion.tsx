'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { SectionBeat, SectionFeedback } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';
import { getScoreColor } from '@/views/components/ui/colors';

interface SectionAccordionProps {
  sections?: SectionFeedback[];
  onSeek?: (seconds: number) => void;
  canSeek?: boolean;
  totalDurationSec?: number;
  mode?: PitchMode;
}

const BEAT_LABELS: Record<SectionBeat, string> = {
  intro: 'Introduction',
  problem: 'Problem',
  solution: 'Solution',
  market: 'Market',
  model: 'Business Model',
  traction: 'Traction',
  team: 'Team',
  ask: 'The Ask',
  demo: 'Demo',
  innovation: 'Innovation',
  impact: 'Impact',
};

const FINAL_YEAR_LABEL_OVERRIDES: Partial<Record<SectionBeat, string>> = {
  solution: 'Approach',
  traction: 'Results',
  ask: 'Next Steps',
};

const MODE_BEATS: Record<PitchMode, SectionBeat[]> = {
  elevator: ['intro', 'problem', 'solution', 'ask'],
  vc_pitch: ['intro', 'problem', 'solution', 'market', 'model', 'traction', 'team', 'ask'],
  hackathon: ['intro', 'problem', 'demo', 'innovation', 'impact', 'ask'],
  final_year: ['intro', 'problem', 'solution', 'traction', 'impact', 'ask'],
};

function formatTime(value: number): string {
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getDefaultDurationByMode(mode?: PitchMode): number {
  switch (mode) {
    case 'elevator': return 45;
    case 'hackathon': return 180;
    case 'final_year': return 240;
    default: return 120;
  }
}

function resolveBeatStartSec(
  section: SectionFeedback,
  index: number,
  beatCount: number,
  durationSec: number,
): number {
  if (Number.isFinite(section.start_sec) && section.start_sec > 0) {
    return section.start_sec;
  }

  if (beatCount <= 0) return 0;
  const slice = durationSec / Math.max(1, beatCount);
  return Math.max(0, index * slice);
}

function isSectionUndetected(section: SectionFeedback): boolean {
  const reason = section.score_reason.toLowerCase();
  const bad = section.bad.toLowerCase();
  const issues = section.top_issues.map((item) => item.toLowerCase());
  const quotes = section.quotes.filter((quote) => quote.trim().length > 0);
  const evidence = section.evidence.trim();
  const confidence = section.confidence ?? 1;

  const explicitMissing =
    reason.includes('not covered') ||
    bad.includes('missing from the pitch') ||
    issues.some((issue) => issue.includes('no ') && issue.includes('content')) ||
    evidence.toLowerCase().startsWith('no clear evidence detected');

  const lowConfidenceMissing = quotes.length === 0 && confidence <= 0.2;

  return explicitMissing || lowConfidenceMissing;
}

function getBeatLabel(beat: SectionBeat, mode?: PitchMode): string {
  if (mode === 'final_year') {
    return FINAL_YEAR_LABEL_OVERRIDES[beat] ?? BEAT_LABELS[beat] ?? beat;
  }
  return BEAT_LABELS[beat] ?? beat;
}

export function SectionAccordion({
  sections,
  onSeek,
  canSeek = false,
  totalDurationSec,
  mode,
}: SectionAccordionProps) {
  const [openBeat, setOpenBeat] = useState<string | null>(null);
  const entries = sections ?? [];
  const expectedBeats = mode ? MODE_BEATS[mode] : (Object.keys(BEAT_LABELS) as SectionBeat[]);
  const undetectedByPayload = entries
    .filter((section) => isSectionUndetected(section))
    .map((section) => section.beat);
  const detectedEntries = entries.filter((section) => !isSectionUndetected(section));
  const detectedBeatSet = new Set(detectedEntries.map((section) => section.beat));
  const undetectedSet = new Set<string>([
    ...undetectedByPayload,
    ...expectedBeats.filter((beat) => !detectedBeatSet.has(beat)),
  ]);
  const undetectedBeats = expectedBeats.filter((beat) => undetectedSet.has(beat));
  const resolvedDuration =
    typeof totalDurationSec === 'number' &&
    Number.isFinite(totalDurationSec) &&
    totalDurationSec > 0
      ? totalDurationSec
      : getDefaultDurationByMode(mode);
  const seekEnabled = canSeek && typeof onSeek === 'function';

  if (detectedEntries.length === 0 && undetectedBeats.length === 0) return null;

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
      {undetectedBeats.length > 0 ? (
        <details className="mb-3 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>
          <summary
            className="cursor-pointer text-xs font-medium select-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            Not detected ({undetectedBeats.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {undetectedBeats.map((beat) => (
              <span
                key={beat}
                className="text-[11px] px-2 py-1 rounded-md border"
                style={{
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {getBeatLabel(beat, mode)} not detected
              </span>
            ))}
          </div>
        </details>
      ) : null}
      {detectedEntries.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          No pitch beats were detected in this run.
        </p>
      ) : null}
      <div className="space-y-1">
        {detectedEntries.map((section, index) => {
          const isOpen = openBeat === section.beat;
          const normalizedScore = Math.min(5, Math.max(0, section.score));
          const scoreColor = getScoreColor((normalizedScore / 5) * 100);
          const startSec = resolveBeatStartSec(
            section,
            index,
            detectedEntries.length,
            resolvedDuration,
          );
          const timestampLabel = formatTime(startSec);

          return (
            <article
              key={`${section.beat}-${index}`}
              className="rounded-lg overflow-hidden transition-colors duration-150"
              style={{
                backgroundColor: isOpen ? 'var(--bg-surface-hover)' : 'transparent',
              }}
            >
              <div className="px-3 py-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setOpenBeat((prev) => (prev === section.beat ? null : section.beat))
                  }
                  className="flex items-center gap-3 text-left min-w-0 flex-1"
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
                  <span className="font-medium text-sm truncate">
                    {getBeatLabel(section.beat, mode)}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {seekEnabled ? (
                    <button
                      type="button"
                      className="results-beat-timestamp-chip results-beat-timestamp-chip-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSeek?.(startSec);
                      }}
                      title="Seek recording"
                      aria-label={`Seek recording to ${timestampLabel}`}
                    >
                      {timestampLabel}
                    </button>
                  ) : (
                    <span className="results-beat-timestamp-chip results-beat-timestamp-chip-muted">
                      {timestampLabel}
                    </span>
                  )}

                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${scoreColor}1a` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(normalizedScore / 5) * 100}%`,
                        backgroundColor: scoreColor,
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold tabular-nums w-6 text-right"
                    style={{ color: scoreColor }}
                  >
                    {normalizedScore}/5
                  </span>
                </div>
              </div>

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
