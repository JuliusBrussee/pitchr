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

const LEADERBOARD = [
  { rank: 1, initials: 'MK', name: 'Maya K.', score: 94 },
  { rank: 2, initials: 'RS', name: 'Ravi S.', score: 91 },
  { rank: 3, initials: 'JL', name: 'Jessica L.', score: 88 },
  { rank: 4, initials: 'DW', name: 'David W.', score: 85 },
  { rank: 5, initials: 'AH', name: 'Alex H.', score: 82 },
];

const CHALLENGE_TYPES = [
  { icon: '⏱️', name: '60-Second Pitch', desc: 'Distill your entire pitch to one minute. Forces ruthless prioritization.' },
  { icon: '🚫', name: 'No Jargon', desc: 'Explain your product without any industry terms. Can your mom understand it?' },
  { icon: '📊', name: 'Data-Only', desc: 'Lead with numbers, not narrative. Every claim backed by a specific metric.' },
  { icon: '🤨', name: 'Pitch to a Skeptic', desc: 'Address every objection upfront. Assume the investor doesn\'t believe you.' },
];

const PROJECTS = [
  { name: 'Series A Pitch', mode: 'VC Pitch', sessions: 23, score: 83, trend: '+31 pts', trendColor: '#22c55e' },
  { name: 'Demo Day (YC)', mode: 'Elevator', sessions: 15, score: 78, trend: '+26 pts', trendColor: '#22c55e' },
  { name: 'Customer Demo', mode: 'VC Pitch', sessions: 8, score: 71, trend: '+18 pts', trendColor: '#ffaa33' },
];

const COMMUNITY_STATS = [
  { value: '2,400+', label: 'Pitches Scored' },
  { value: '847', label: 'Active Founders' },
  { value: '+23pts', label: 'Avg Improvement' },
  { value: '142', label: 'Hit Investor-Ready' },
];

export function CompeteChapter({ chapter }: { chapter: ChapterConfig }) {
  const challengeRef = useReveal(0.1);
  const typesRef = useReveal(0.1);
  const portfolioRef = useReveal(0.1);
  const communityRef = useReveal(0.1);

  return (
    <div className="fp-page" style={{ '--fp-color': chapter.color } as React.CSSProperties}>
      <div className="fp-aura" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${chapter.color}12 0%, transparent 70%)` }} />

      <JourneyBarCompact currentSlug={chapter.slug} />

      <div className="fp-container">
        <ChapterHero chapter={chapter} />

        {/* Act 1: This Week's Challenge */}
        <section className="ch-section" ref={challengeRef}>
          <h2 className="ch-section-title ch-section-centered">This week&apos;s challenge</h2>
          <div className="ch-compete-challenge ch-stagger">
            <div className="ch-compete-challenge-header">
              <span className="ch-compete-challenge-badge" style={{ backgroundColor: chapter.color }}>Week 12</span>
              <span className="ch-compete-challenge-timer">3 days remaining</span>
            </div>
            <div className="ch-compete-challenge-body">
              <div className="ch-compete-challenge-title">The 60-Second Elevator Pitch</div>
              <div className="ch-compete-challenge-desc">
                Distill your pitch to exactly 60 seconds. No slides, no props — just you and your words. The constraint forces you to find the absolute core of your value proposition.
              </div>
              <div className="ch-compete-leaderboard">
                {LEADERBOARD.map((leader) => (
                  <div
                    key={leader.rank}
                    className="ch-compete-leader"
                    style={leader.rank === 1 ? { borderColor: `${chapter.color}40` } : undefined}
                  >
                    <span className="ch-compete-leader-rank" style={{ color: leader.rank <= 3 ? chapter.color : 'var(--text-muted)' }}>
                      #{leader.rank}
                    </span>
                    <span className="ch-compete-leader-avatar">{leader.initials}</span>
                    <span className="ch-compete-leader-name">{leader.name}</span>
                    <span className="ch-compete-leader-score" style={{ color: chapter.color }}>{leader.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Act 2: Challenge Types */}
        <section className="ch-section" ref={typesRef}>
          <h2 className="ch-section-title ch-section-centered">Sharpen different muscles</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Each challenge type develops a different pitch skill. The best founders master them all.
          </p>
          <div className="ch-compete-types ch-stagger">
            {CHALLENGE_TYPES.map((type) => (
              <div key={type.name} className="ch-compete-type">
                <div className="ch-compete-type-icon">{type.icon}</div>
                <div className="ch-compete-type-name">{type.name}</div>
                <div className="ch-compete-type-desc">{type.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 3: Your Pitch Portfolio */}
        <section className="ch-section" ref={portfolioRef}>
          <h2 className="ch-section-title ch-section-centered">Your pitch portfolio</h2>
          <p className="ch-section-sub ch-section-centered" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Different pitches for different audiences. Each project tracks independently.
          </p>
          <div className="ch-compete-portfolio ch-stagger">
            {PROJECTS.map((proj) => (
              <div key={proj.name} className="ch-compete-project">
                <div className="ch-compete-project-name">{proj.name}</div>
                <div className="ch-compete-project-meta">{proj.mode} · {proj.sessions} sessions</div>
                <div className="ch-compete-project-score" style={{ color: chapter.color }}>{proj.score}</div>
                <div className="ch-compete-project-trend" style={{ color: proj.trendColor }}>{proj.trend}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Act 4: Community Proof */}
        <section className="ch-section ch-section-centered" ref={communityRef}>
          <h2 className="ch-section-title">The community</h2>
          <p className="ch-section-sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            You&apos;re not practicing alone.
          </p>
          <div className="ch-compete-community ch-stagger">
            {COMMUNITY_STATS.map((stat) => (
              <div key={stat.label} className="ch-compete-community-stat">
                <div className="ch-compete-community-value" style={{ color: chapter.color }}>{stat.value}</div>
                <div className="ch-compete-community-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <ChapterCTA chapter={chapter} />
      </div>
    </div>
  );
}
