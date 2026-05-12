'use client';

import Link from 'next/link';
import { CHAPTERS } from '@/config/chapters';
import type { ChapterConfig } from '@/config/chapters';

/* ── Landing Page variant (larger, with descriptions) ── */
export function JourneyBarLanding() {
  return (
    <section className="jb-landing-section">
      <div className="jb-landing-inner">
        <h2 className="jb-landing-title">Your pitch journey</h2>
        <p className="jb-landing-sub">Five chapters from rough draft to investor-ready.</p>
        <div className="jb-landing-nodes">
          {CHAPTERS.map((ch, i) => (
            <JourneyLandingNode key={ch.slug} chapter={ch} isLast={i === CHAPTERS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyLandingNode({ chapter, isLast }: { chapter: ChapterConfig; isLast: boolean }) {
  return (
    <div className="jb-landing-node-wrap">
      <Link href={`/features/${chapter.slug}`} className="jb-landing-node">
        <div className="jb-landing-dot" style={{ backgroundColor: chapter.color }}>
          <span className="jb-landing-dot-num">{chapter.number}</span>
        </div>
        <div className="jb-landing-label" style={{ color: chapter.color }}>{chapter.title}</div>
        <div className="jb-landing-desc">{chapter.verb}</div>
      </Link>
      {!isLast && <div className="jb-landing-connector" />}
    </div>
  );
}

/* ── Chapter Page variant (compact, sticky) ── */
export function JourneyBarCompact({ currentSlug }: { currentSlug: string }) {
  const currentIdx = CHAPTERS.findIndex((c) => c.slug === currentSlug);

  return (
    <nav className="jb-compact" aria-label="Journey navigation">
      <div className="jb-compact-inner">
        {CHAPTERS.map((ch, i) => {
          const isCurrent = ch.slug === currentSlug;
          const isPast = i < currentIdx;
          return (
            <div key={ch.slug} className="jb-compact-node-wrap">
              <Link
                href={`/features/${ch.slug}`}
                className={`jb-compact-node ${isCurrent ? 'jb-compact-current' : ''} ${isPast ? 'jb-compact-past' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <div
                  className={`jb-compact-dot ${isCurrent ? 'jb-compact-dot-active' : ''}`}
                  style={{
                    backgroundColor: isCurrent || isPast ? ch.color : 'transparent',
                    borderColor: ch.color,
                  }}
                >
                  {isCurrent && <span className="jb-compact-pulse" style={{ backgroundColor: ch.color }} />}
                </div>
                <span
                  className="jb-compact-label"
                  style={{ color: isCurrent ? ch.color : undefined }}
                >
                  {ch.title}
                </span>
              </Link>
              {i < CHAPTERS.length - 1 && (
                <div
                  className="jb-compact-line"
                  style={{ backgroundColor: isPast ? ch.color : 'var(--border-color)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
