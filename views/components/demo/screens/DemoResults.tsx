'use client';

import { useEffect, useState, useRef } from 'react';
import { Zap, FileText, BarChart3, ArrowLeft, Radio, ArrowRight } from 'lucide-react';
import { DemoSidebar } from '@/views/components/demo/DemoSidebar';
import {
  DEMO_SCORE,
  DEMO_VERDICT,
  DEMO_RUBRIC,
  DEMO_FIXES,
  DEMO_REWRITE_HUNKS,
  DEMO_DELIVERY,
} from '@/views/components/demo/demoData';
import {
  getScoreColor,
  getScoreBgColor,
  getScoreBandLabel,
  RUBRIC_COLORS,
} from '@/views/components/ui/colors';

interface DemoResultsProps {
  isActive: boolean;
  scrollTo?: string;
}

function MiniRing({ score, maxScore, color, size = 36 }: { score: number; maxScore: number; color: string; size?: number }) {
  const r = size / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / maxScore) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="demo-score-hero__mini-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}

const IMPACT_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

export function DemoResults({ isActive, scrollTo }: DemoResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const hasAnimated = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  // Score count-up animation — fires once when results become active
  useEffect(() => {
    if (!isActive || hasAnimated.current) return;
    hasAnimated.current = true;

    let frame: number;
    const start = performance.now();
    const duration = 1100;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * DEMO_SCORE));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 350);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [isActive]);

  // Scroll to target section within .demo-main when scrollTo changes
  useEffect(() => {
    if (!mainRef.current) return;
    if (!scrollTo) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = mainRef.current.querySelector(scrollTo) as HTMLElement | null;
    if (target) {
      // Get position relative to scroll container using bounding rects
      const containerRect = mainRef.current.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollOffset = targetRect.top - containerRect.top + mainRef.current.scrollTop - 140;
      mainRef.current.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }
  }, [scrollTo]);

  const displayScore = animatedScore;
  const color = getScoreColor(displayScore);
  const bgColor = getScoreBgColor(displayScore);
  const bandLabel = getScoreBandLabel(displayScore);

  const ringR = 48;
  const ringCircumference = 2 * Math.PI * ringR;
  const ringOffset = ringCircumference - (displayScore / 100) * ringCircumference;

  return (
    <div className="demo-app-layout">
      <DemoSidebar activeNav="results" />
      <main ref={mainRef} className="demo-main demo-results">
        {/* Header */}
        <div className="demo-results__header">
          <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          <div>
            <h1 className="demo-results__title">Pitch Analysis</h1>
            <span className="demo-results__meta">Mar 7, 2026 · VC Pitch · Series A Pitch</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="demo-results__qa-btn">
            <Radio size={14} />
            Start Live Q&A
          </button>
        </div>

        {/* Score Hero */}
        <div className="demo-score-hero">
          <div className="demo-score-hero__ring-wrap">
            <div
              className="demo-score-hero__ring-glow"
              style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }}
            />
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={ringR} fill="none" stroke="var(--border-color)" strokeWidth={7} />
              <circle
                cx={60}
                cy={60}
                r={ringR}
                fill="none"
                stroke={color}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div className="demo-score-hero__ring-center">
              <span className="demo-score-hero__ring-value">{displayScore}</span>
              <span className="demo-score-hero__ring-band" style={{ color, backgroundColor: bgColor }}>
                {bandLabel}
              </span>
            </div>
          </div>

          {/* Rubric breakdown */}
          <div className="demo-score-hero__rubric">
            {DEMO_RUBRIC.map((item) => {
              const catColor = RUBRIC_COLORS[item.category] ?? '#6b7280';
              return (
                <div key={item.category} className="demo-score-hero__rubric-item">
                  <MiniRing score={item.score} maxScore={item.max_score} color={catColor} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="demo-score-hero__rubric-label">{item.category}</span>
                      <span className="demo-score-hero__rubric-score">{item.score}/{item.max_score}</span>
                    </div>
                    <div className="demo-score-hero__rubric-rationale">{item.rationale}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verdict */}
        <div className="demo-score-hero__verdict">{DEMO_VERDICT}</div>

        {/* Top Fixes */}
        <div className="demo-fixes">
          <h3 className="demo-dash__section-title">
            <Zap size={12} />
            Top Fixes
          </h3>
          <div className="demo-fixes__list">
            {DEMO_FIXES.map((fix) => {
              const impactColor = IMPACT_COLORS[fix.impact];
              return (
                <div
                  key={fix.rank}
                  className="demo-fix-card"
                  style={{ borderLeftColor: impactColor }}
                >
                  <div className="demo-fix-card__rank" style={{ backgroundColor: impactColor }}>
                    {fix.rank}
                  </div>
                  <div className="demo-fix-card__content">
                    <p className="demo-fix-card__issue">{fix.issue}</p>
                    <p className="demo-fix-card__fix">{fix.fix}</p>
                  </div>
                  <span
                    className="demo-fix-card__impact"
                    style={{ color: impactColor, backgroundColor: `${impactColor}1a` }}
                  >
                    {fix.impact}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewrite Diff */}
        <div className="demo-rewrite">
          <h3 className="demo-dash__section-title">
            <FileText size={12} />
            Rewrite Comparison
          </h3>
          <div className="demo-rewrite__hunks">
            {DEMO_REWRITE_HUNKS.map((hunk, i) => (
              <div key={i} className="demo-rewrite__hunk">
                <div className="demo-rewrite__hunk-number">{i + 1}</div>
                <div className="demo-rewrite__hunk-content">
                  <div className="demo-rewrite__side demo-rewrite__side--before">
                    <span className="demo-rewrite__tag demo-rewrite__tag--before">Original</span>
                    <div>{hunk.before}</div>
                  </div>
                  <div className="demo-rewrite__arrow">
                    <ArrowRight size={14} />
                  </div>
                  <div className="demo-rewrite__side demo-rewrite__side--after">
                    <span className="demo-rewrite__tag demo-rewrite__tag--after">Improved</span>
                    <div>{hunk.after}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Metrics */}
        <div className="demo-delivery">
          <h3 className="demo-dash__section-title">
            <BarChart3 size={12} />
            Delivery Metrics
          </h3>
          <div className="demo-delivery__grid">
            <div className="demo-delivery__card">
              <span className="demo-delivery__card-value">{DEMO_DELIVERY.wpm}</span>
              <span className="demo-delivery__card-label">WPM</span>
              <span className="demo-delivery__card-hint">Target: 140</span>
            </div>
            <div className="demo-delivery__card">
              <span className="demo-delivery__card-value">{DEMO_DELIVERY.duration_seconds}s</span>
              <span className="demo-delivery__card-label">Duration</span>
              <span className="demo-delivery__card-hint">1:03</span>
            </div>
            <div className="demo-delivery__card">
              <span className="demo-delivery__card-value">{DEMO_DELIVERY.filler_count}</span>
              <span className="demo-delivery__card-label">Fillers</span>
              <span className="demo-delivery__card-hint">um, basically</span>
            </div>
            <div className="demo-delivery__card">
              <span className="demo-delivery__card-value">{DEMO_DELIVERY.word_count}</span>
              <span className="demo-delivery__card-label">Words</span>
              <span className="demo-delivery__card-hint">109 unique</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
