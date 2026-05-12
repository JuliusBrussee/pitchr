'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { GlassCard } from '@/views/components/ui';
import { getScoreColor, getScoreBandLabel } from '@/views/components/ui/colors';
import {
  DEMO_BAD_PITCH,
  DEMO_REWRITTEN_PITCH,
  DEMO_BAD_HIGHLIGHTS,
  DEMO_GOOD_HIGHLIGHTS,
  DEMO_SCORES,
  DEMO_REWRITE_SCORE,
} from '@/config/onboarding';

interface RewriteDemoStepProps {
  onNext: () => void;
}

function highlightText(
  text: string,
  phrases: string[],
  color: string,
  bgColor: string,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliestIndex = remaining.length;
    let matchedPhrase = '';

    for (const phrase of phrases) {
      const idx = remaining.toLowerCase().indexOf(phrase.toLowerCase());
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx;
        matchedPhrase = phrase;
      }
    }

    if (matchedPhrase && earliestIndex < remaining.length) {
      if (earliestIndex > 0) {
        result.push(<span key={key++}>{remaining.slice(0, earliestIndex)}</span>);
      }
      result.push(
        <mark
          key={key++}
          style={{
            backgroundColor: bgColor,
            color,
            padding: '1px 4px',
            borderRadius: '3px',
          }}
        >
          {remaining.slice(earliestIndex, earliestIndex + matchedPhrase.length)}
        </mark>,
      );
      remaining = remaining.slice(earliestIndex + matchedPhrase.length);
    } else {
      result.push(<span key={key++}>{remaining}</span>);
      remaining = '';
    }
  }

  return result;
}

export function RewriteDemoStep({ onNext }: RewriteDemoStepProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [displayScore, setDisplayScore] = useState(DEMO_SCORES.overall);
  const [showTagline, setShowTagline] = useState(false);
  const scoreAnimRef = useRef<number | null>(null);

  useEffect(() => {
    // Show "After" column after 600ms
    const t1 = setTimeout(() => setShowAfter(true), 600);

    // Animate score after 1.2s
    const t2 = setTimeout(() => {
      const startTime = performance.now();
      const startScore = DEMO_SCORES.overall;
      const endScore = DEMO_REWRITE_SCORE;
      const duration = 2000;

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(startScore + (endScore - startScore) * eased));
        if (progress < 1) {
          scoreAnimRef.current = requestAnimationFrame(animate);
        } else {
          setTimeout(() => setShowTagline(true), 400);
        }
      };
      scoreAnimRef.current = requestAnimationFrame(animate);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    };
  }, []);

  const scoreColor = getScoreColor(displayScore);
  const bandLabel = getScoreBandLabel(displayScore);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-4xl">
        {/* Before / After columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Before */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#ef4444' }}
            >
              Before
            </p>
            <GlassCard padding="md" animate={false}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {highlightText(
                  DEMO_BAD_PITCH,
                  DEMO_BAD_HIGHLIGHTS,
                  '#ef4444',
                  'rgba(239, 68, 68, 0.15)',
                )}
              </p>
            </GlassCard>
          </div>

          {/* After */}
          <div
            style={{
              opacity: showAfter ? 1 : 0,
              transform: showAfter ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#22c55e' }}
            >
              After
            </p>
            <GlassCard padding="md" animate={false}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {highlightText(
                  DEMO_REWRITTEN_PITCH,
                  DEMO_GOOD_HIGHLIGHTS,
                  '#22c55e',
                  'rgba(34, 197, 94, 0.15)',
                )}
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Score transition */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {DEMO_SCORES.overall}
            </span>
            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-5xl font-bold tabular-nums transition-colors duration-300"
              style={{ color: scoreColor }}
            >
              {displayScore}
            </span>
          </div>
          <span
            className="text-sm font-semibold uppercase tracking-wider transition-colors duration-300"
            style={{ color: scoreColor }}
          >
            {bandLabel}
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-xl font-semibold text-center mb-8 transition-all duration-500"
          style={{
            color: 'var(--text-primary)',
            opacity: showTagline ? 1 : 0,
            transform: showTagline ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          Same pitch. Same founder. Better words.
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#ff5941' }}
          >
            Let&apos;s set you up
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
