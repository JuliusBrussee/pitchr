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

const TIMELINE_NODES = [
  { day: 'Day 1', score: 47, color: '#ef4444', insight: 'First attempt. Structure was all over the place, no market data.' },
  { day: 'Day 2', score: 52, color: '#ef4444', insight: 'Applied top fix: added TAM/SAM slide. Small jump.' },
  { day: 'Day 4', score: 58, color: '#ef4444', insight: 'Rewrote the opening. Clearer, but delivery still rushed.' },
  { day: 'Day 5', score: 54, color: '#ef4444', insight: 'Bad day. Tried too many changes at once. Score dipped.' },
  { day: 'Day 7', score: 65, color: '#ffaa33', insight: 'Breakthrough: slowed down WPM from 180 to 155. Clarity jumped.' },
  { day: 'Day 10', score: 74, color: '#ffaa33', insight: 'Evidence category crossed 80 for the first time.' },
  { day: 'Day 12', score: 78, color: '#ffaa33', insight: 'Eliminated all filler words. Delivery score: 85.' },
  { day: 'Day 14', score: 83, color: '#22c55e', insight: 'Investor-ready. All categories above 75. Deck forwarded to partners.' },
];

const PATTERNS = [
  {
    title: 'Monday slump',
    desc: 'Your Evidence score drops 12% on Mondays. Weekend rust is real — warm up before important meetings.',
    bars: [40, 70, 75, 80, 78, 65, 45],
  },
  {
    title: 'Afternoon clarity',
    desc: 'Clarity peaks between 2-4 PM. Your best sessions consistently happen after lunch.',
    bars: [55, 60, 65, 85, 90, 80, 70],
  },
  {
    title: 'Delivery consistency',
    desc: 'WPM variance dropped 60% over 2 weeks. You\'re developing muscle memory for your ideal pace.',
    bars: [90, 70, 85, 60, 75, 72, 73],
  },
];

const TRAJECTORIES = [
  { label: 'Sporadic practice', color: '#ef4444' },
  { label: 'Daily practice', color: '#ffaa33' },
  { label: 'Daily + apply fixes', color: '#22c55e' },
];

export function TrackChapter({ chapter }: { chapter: ChapterConfig }) {
  const timelineRef = useReveal(0.1);
  const patternsRef = useReveal(0.1);
  const compoundRef = useReveal(0.1);

  return (
    <div className="fp-page" style={{ '--fp-color': chapter.color } as React.CSSProperties}>
      <div className="fp-aura" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${chapter.color}12 0%, transparent 70%)` }} />

      <JourneyBarCompact currentSlug={chapter.slug} />

      <div className="fp-container">
        <ChapterHero chapter={chapter} />

        {/* Act 1: A Founder's Journey */}
        <section className="ch-section" ref={timelineRef}>
          <h2 className="ch-section-title ch-section-centered">A founder&apos;s two-week journey</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Real improvement isn&apos;t linear. There are dips, breakthroughs, and bad days. Here&apos;s what it actually looks like.
          </p>
          <div className="ch-track-timeline ch-stagger">
            {TIMELINE_NODES.map((node) => (
              <div key={node.day} className="ch-track-node">
                <div className="ch-track-node-dot" style={{ borderColor: node.color, backgroundColor: `${node.color}20` }} />
                <div className="ch-track-node-day">{node.day}</div>
                <div className="ch-track-node-score" style={{ color: node.color }}>{node.score}</div>
                <div className="ch-track-node-insight">{node.insight}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 2: Pattern Recognition */}
        <section className="ch-section" ref={patternsRef}>
          <h2 className="ch-section-title ch-section-centered">Patterns you didn&apos;t know you had</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Analytics reveals the hidden rhythms in your performance.
          </p>
          <div className="ch-track-patterns">
            {PATTERNS.map((pattern) => (
              <div key={pattern.title} className="ch-track-pattern ch-stagger">
                <div className="ch-track-pattern-chart">
                  {pattern.bars.map((h, i) => (
                    <div
                      key={i}
                      className="ch-track-pattern-bar"
                      style={{ height: `${h}%`, backgroundColor: `${chapter.color}${h > 75 ? '' : '60'}` }}
                    />
                  ))}
                </div>
                <div className="ch-track-pattern-title">{pattern.title}</div>
                <div className="ch-track-pattern-desc">{pattern.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 3: The Compound Effect */}
        <section className="ch-section ch-section-centered" ref={compoundRef}>
          <h2 className="ch-section-title">The compound effect</h2>
          <p className="ch-section-sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Three trajectories over 30 days. The difference isn&apos;t talent — it&apos;s consistency.
          </p>
          <div className="ch-track-compound ch-stagger">
            <div className="ch-track-compound-chart">
              <div className="ch-track-compound-line" />
              <div className="ch-track-compound-label">Investor Ready (80+)</div>
              {/* SVG chart with 3 trajectory lines */}
              <svg viewBox="0 0 300 150" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, padding: '24px' }}>
                {/* Sporadic */}
                <path
                  d="M0,120 Q50,110 100,105 T200,95 T300,85"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
                {/* Daily */}
                <path
                  d="M0,120 Q50,100 100,80 T200,55 T300,40"
                  fill="none"
                  stroke="#ffaa33"
                  strokeWidth="2"
                  opacity="0.8"
                />
                {/* Daily + fixes */}
                <path
                  d="M0,120 Q50,90 100,55 T200,25 T300,10"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="ch-track-compound-legend">
              {TRAJECTORIES.map((t) => (
                <div key={t.label} className="ch-track-compound-legend-item">
                  <span className="ch-track-compound-legend-dot" style={{ backgroundColor: t.color }} />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <ChapterCTA chapter={chapter} />
      </div>
    </div>
  );
}
