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

const EPISODES = [
  {
    title: 'The Vague Opening',
    original: '"We\'re building a platform that leverages AI to disrupt the way companies handle their data infrastructure and optimize workflows."',
    rationale: 'Investors hear "platform + AI + disrupt" and immediately check out. Be specific: what do you do, for whom, and why now?',
    rewrite: '"We help mid-market e-commerce companies cut data processing costs by 60% with automated pipeline management. Our first 12 customers saved $2.3M combined in 6 months."',
    points: '+8 pts',
  },
  {
    title: 'The Missing Market',
    original: '"The market opportunity is huge — everyone needs better data tools."',
    rationale: '"Everyone" is not a market. Investors need specific TAM/SAM numbers and a credible path to capture.',
    rewrite: '"The data pipeline management market is $14B and growing 23% YoY. We\'re targeting the $3.2B mid-market segment where legacy tools can\'t keep up with real-time demands."',
    points: '+11 pts',
  },
  {
    title: 'The Weak Close',
    original: '"So yeah, we\'re looking to raise some money to keep growing. Any questions?"',
    rationale: 'Your close is your ask. Be specific about the amount, what it funds, and the milestones it unlocks.',
    rewrite: '"We\'re raising $2.5M to hire 3 engineers and expand to 50 customers by Q4. At our current unit economics, that puts us at $4M ARR — the benchmark for Series A conversations."',
    points: '+12 pts',
  },
];

const IMPACT_STEPS = [
  { score: 52, label: 'Start' },
  { score: 60, label: 'Fix #1' },
  { score: 71, label: 'Fix #2' },
  { score: 83, label: 'Fix #3' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 70) return '#ffaa33';
  return '#ef4444';
}

export function ImproveChapter({ chapter }: { chapter: ChapterConfig }) {
  const transformRef = useReveal(0.1);
  const impactRef = useReveal(0.1);
  const voiceRef = useReveal(0.1);

  return (
    <div className="fp-page" style={{ '--fp-color': chapter.color } as React.CSSProperties}>
      <div className="fp-aura" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${chapter.color}12 0%, transparent 70%)` }} />

      <JourneyBarCompact currentSlug={chapter.slug} />

      <div className="fp-container">
        <ChapterHero chapter={chapter} />

        {/* Act 1: The Transformation */}
        <section className="ch-section" ref={transformRef}>
          <h2 className="ch-section-title ch-section-centered">Three fixes. One transformed pitch.</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Real examples of how small, specific changes compound into dramatic score improvements.
          </p>
          <div className="ch-improve-episodes">
            {EPISODES.map((ep, i) => (
              <div key={ep.title} className="ch-improve-episode ch-stagger">
                <div className="ch-improve-episode-header">
                  <div className="ch-improve-episode-num" style={{ backgroundColor: chapter.color }}>{i + 1}</div>
                  <div className="ch-improve-episode-title">{ep.title}</div>
                  <span style={{ marginLeft: 'auto', color: chapter.color, fontWeight: 800, fontSize: 13 }}>{ep.points}</span>
                </div>
                <div className="ch-improve-episode-body">
                  <div className="ch-improve-original">{ep.original}</div>
                  <div className="ch-improve-rationale">{ep.rationale}</div>
                  <div className="ch-improve-rewrite" style={{ borderColor: `${chapter.color}40`, background: `${chapter.color}06` }}>
                    {ep.rewrite}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 2: Impact Stack */}
        <section className="ch-section ch-section-centered" ref={impactRef}>
          <h2 className="ch-section-title">Small fixes, compounding impact</h2>
          <p className="ch-section-sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Each fix builds on the last. Watch a 52 become an 83.
          </p>
          <div className="ch-improve-impact ch-stagger">
            {IMPACT_STEPS.map((step, i) => (
              <div key={step.label} style={{ display: 'contents' }}>
                <div className="ch-improve-impact-step">
                  <span className="ch-improve-impact-score" style={{ color: getScoreColor(step.score) }}>{step.score}</span>
                  <span className="ch-improve-impact-label">{step.label}</span>
                </div>
                {i < IMPACT_STEPS.length - 1 && <span className="ch-improve-impact-arrow">→</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Act 3: The Voice Promise */}
        <section className="ch-section ch-section-centered" ref={voiceRef}>
          <div className="ch-improve-voice ch-stagger">
            <h2 className="ch-section-title">&ldquo;Will it still sound like me?&rdquo;</h2>
            <p className="ch-improve-voice-proof">
              The rewrite preserves your vocabulary, your tone, and your personality. It restructures and sharpens — it doesn&apos;t replace your voice. Think of it as an editor, not a ghostwriter. Your investors are betting on <em>you</em>, and the pitch should sound like it.
            </p>
          </div>
        </section>

        <ChapterCTA chapter={chapter} />
      </div>
    </div>
  );
}
