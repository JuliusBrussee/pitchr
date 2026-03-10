'use client';

import { useEffect, useRef } from 'react';
import type { ChapterConfig } from '@/config/chapters';
import { ChapterHero } from '@/views/components/features/ChapterHero';
import { ChapterCTA } from '@/views/components/features/ChapterCTA';
import { JourneyBarCompact } from '@/views/components/features/JourneyBar';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('fp-visible');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const children = el.querySelectorAll('.ch-stagger');
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * 0.1}s`;
            });
            el.classList.add('fp-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const RUBRIC_DIMENSIONS = [
  { name: 'Structure', desc: 'Does your pitch follow a logical arc? Problem → solution → market → traction → ask.' },
  { name: 'Clarity', desc: 'Can a non-expert understand what you do in 30 seconds? No jargon, no ambiguity.' },
  { name: 'Evidence', desc: 'Are your claims backed by data? Traction, market research, competitive analysis.' },
  { name: 'Market', desc: 'Is the market large enough? TAM/SAM/SOM, growth trends, timing argument.' },
  { name: 'Delivery', desc: 'Pacing, confidence, filler words, eye contact cues in your speaking pattern.' },
];

const DELIVERY_METRICS = [
  { name: 'Speaking Pace', value: '180 WPM', pct: 90, note: 'Investors tune out above 160. Slow down.' },
  { name: 'Filler Words', value: '14 total', pct: 70, note: '"Um" and "basically" appeared 14 times in 3 minutes.' },
  { name: 'Time Compliance', value: '3:42 / 3:00', pct: 80, note: '42 seconds over — that\'s your closing slide gone.' },
];

const SCORE_RANGES = [
  { range: '90-100', label: 'Investor-Ready', desc: 'Deck gets forwarded to partners', color: '#22c55e' },
  { range: '80-89', label: 'Strong', desc: 'Follow-up meeting likely', color: '#22c55e' },
  { range: '70-79', label: 'Promising', desc: 'Interesting but needs polish', color: '#ffaa33' },
  { range: '60-69', label: 'Average', desc: 'Polite nods, no follow-up', color: '#ffaa33' },
  { range: 'Below 60', label: 'Needs Work', desc: 'Lost attention by slide 3', color: '#ef4444' },
];

export function AnalyzeChapter({ chapter }: { chapter: ChapterConfig }) {
  const quoteRef = useReveal(0.1);
  const splitRef = useReveal(0.1);
  const mapRef = useReveal(0.1);

  return (
    <div className="fp-page" style={{ '--fp-color': chapter.color } as React.CSSProperties}>
      <div className="fp-aura" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${chapter.color}12 0%, transparent 70%)` }} />

      <JourneyBarCompact currentSlug={chapter.slug} />

      <div className="fp-container">
        <ChapterHero chapter={chapter} />

        {/* Act 1: The Reality Check */}
        <section className="ch-section ch-section-centered" ref={quoteRef}>
          <div className="ch-analyze-quote ch-stagger">
            <blockquote>
              &ldquo;I practiced for two weeks and walked in confident. Then I saw the recording. I was speaking at 180 words per minute, said &lsquo;basically&rsquo; nine times, and my market slide had zero data. I thought I was a 90. I was a 52.&rdquo;
            </blockquote>
            <cite>— Every founder, at some point</cite>
          </div>
        </section>

        {/* Act 2: Split Diagnostic Panel */}
        <section className="ch-section" ref={splitRef}>
          <h2 className="ch-section-title ch-section-centered">The dual diagnosis</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Your pitch is evaluated on two axes: what you say and how you say it.
          </p>
          <div className="ch-analyze-split">
            <div className="ch-analyze-panel ch-stagger">
              <div className="ch-analyze-panel-title" style={{ color: chapter.color }}>
                📊 What you say
              </div>
              {RUBRIC_DIMENSIONS.map((dim) => (
                <div key={dim.name} className="ch-analyze-dimension">
                  <div className="ch-analyze-dim-name">{dim.name}</div>
                  <div className="ch-analyze-dim-desc">{dim.desc}</div>
                </div>
              ))}
            </div>
            <div className="ch-analyze-panel ch-stagger">
              <div className="ch-analyze-panel-title" style={{ color: chapter.color }}>
                🎤 How you say it
              </div>
              {DELIVERY_METRICS.map((metric) => (
                <div key={metric.name} className="ch-analyze-metric">
                  <div className="ch-analyze-metric-header">
                    <span className="ch-analyze-metric-name">{metric.name}</span>
                    <span className="ch-analyze-metric-value" style={{ color: chapter.color }}>{metric.value}</span>
                  </div>
                  <div className="ch-analyze-metric-bar">
                    <div className="ch-analyze-metric-fill" style={{ width: `${metric.pct}%`, backgroundColor: chapter.color }} />
                  </div>
                  <div className="ch-analyze-metric-note">{metric.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Act 3: The Score Map */}
        <section className="ch-section ch-section-centered" ref={mapRef}>
          <h2 className="ch-section-title">What your score really means</h2>
          <p className="ch-section-sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            A number is just a number — until you know what investors do with it.
          </p>
          <div className="ch-analyze-score-map ch-stagger">
            {SCORE_RANGES.map((range) => (
              <div key={range.range} className="ch-analyze-score-range">
                <span className="ch-analyze-score-badge" style={{ color: range.color }}>{range.range}</span>
                <span className="ch-analyze-score-label">{range.label}</span>
                <span className="ch-analyze-score-desc">{range.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <ChapterCTA chapter={chapter} />
      </div>
    </div>
  );
}
