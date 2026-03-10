'use client';

import Link from 'next/link';
import type { ChapterConfig } from '@/config/chapters';
import { getNextChapter } from '@/config/chapters';

export function ChapterCTA({ chapter }: { chapter: ChapterConfig }) {
  const next = getNextChapter(chapter.slug);

  return (
    <section className="fp-cta ch-cta">
      <div
        className="fp-cta-glow"
        style={{ background: `radial-gradient(circle at center, ${chapter.color}20 0%, transparent 70%)` }}
      />
      <h2 className="fp-cta-title">{chapter.ctaHeadline}</h2>
      <p className="fp-cta-desc">{chapter.ctaDescription}</p>
      <Link href="/#waitlist" className="fp-cta-btn" style={{ background: chapter.color }}>
        Join the Waitlist
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>

      {/* Bridge to next chapter */}
      {next && (
        <div className="ch-cta-bridge">
          <span className="ch-cta-bridge-label">Next chapter</span>
          <Link href={`/features/${next.slug}`} className="ch-cta-bridge-link" style={{ color: next.color }}>
            <span className="ch-cta-bridge-num" style={{ backgroundColor: next.color }}>{next.number}</span>
            {next.title}: {next.verb}
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {!next && (
        <Link href="/" className="fp-back-link">&larr; Back to home</Link>
      )}
    </section>
  );
}
