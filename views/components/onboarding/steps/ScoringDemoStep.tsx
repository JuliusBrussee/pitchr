'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { GlassCard, CategoryBar, ScoreBadge } from '@/views/components/ui';
import { getRubricColor } from '@/views/components/ui/colors';
import { DEMO_BAD_PITCH, DEMO_SCORES } from '@/config/onboarding';
import { SiriBubble } from '@/views/components/SiriBubble';

interface ScoringDemoStepProps {
  onNext: () => void;
}

type Phase = 'pre-score' | 'analyzing' | 'results';

export function ScoringDemoStep({ onNext }: ScoringDemoStepProps) {
  const [phase, setPhase] = useState<Phase>('pre-score');
  const [activeIndicator, setActiveIndicator] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const scoreAnimRef = useRef<number | null>(null);

  const handleScore = () => {
    setPhase('analyzing');
  };

  // Analyzing phase: sequential indicators then transition to results
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_SCORES.rubric.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveIndicator(i), 600 * (i + 1)));
    });
    timers.push(setTimeout(() => setPhase('results'), 3000));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Results phase: animate score counter 0 -> 34
  useEffect(() => {
    if (phase !== 'results') return;
    const startTime = performance.now();
    const duration = 1500;
    const targetScore = DEMO_SCORES.overall;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(targetScore * eased));
      if (progress < 1) {
        scoreAnimRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowVerdict(true), 500);
        setTimeout(() => setShowCta(true), 1000);
      }
    };
    scoreAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    };
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Phase 1: Pre-score */}
        {phase === 'pre-score' && (
          <div className="space-y-6">
            <GlassCard padding="md" animate={false}>
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: 'var(--text-secondary)' }}
              >
                {DEMO_BAD_PITCH}
              </p>
            </GlassCard>
            <div className="flex justify-center">
              <button
                onClick={handleScore}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#ff5941' }}
              >
                <Zap size={20} />
                Score this pitch
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Analyzing */}
        {phase === 'analyzing' && (
          <div className="flex flex-col items-center gap-6">
            <div style={{ width: 150, height: 150 }}>
              <SiriBubble state="active" />
            </div>
            <p
              className="text-lg font-medium animate-pulse"
              style={{ color: 'var(--text-secondary)' }}
            >
              Analyzing...
            </p>
            <div className="flex items-center gap-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <div
                  key={item.category}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= activeIndicator
                      ? getRubricColor(item.category)
                      : 'var(--border-color)',
                    transform: i === activeIndicator ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Results */}
        {phase === 'results' && (
          <div className="flex flex-col items-center gap-6">
            <div style={{ width: 150, height: 150 }}>
              <SiriBubble state="negative" />
            </div>

            <p
              className="text-6xl font-bold tabular-nums"
              style={{ color: '#ef4444' }}
            >
              {displayScore}
            </p>

            <ScoreBadge score={DEMO_SCORES.overall} showLabel size="md" />

            {/* Verdict */}
            <p
              className="text-sm font-medium text-center max-w-lg transition-all duration-500"
              style={{
                color: 'var(--text-primary)',
                opacity: showVerdict ? 1 : 0,
                transform: showVerdict ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              {DEMO_SCORES.verdict}
            </p>

            {/* Category bars */}
            <div className="w-full max-w-lg space-y-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <CategoryBar
                  key={item.category}
                  label={item.label}
                  score={item.score}
                  maxScore={item.maxScore}
                  color={getRubricColor(item.category)}
                  delay={i}
                />
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#ff5941',
                opacity: showCta ? 1 : 0,
                transform: showCta ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, scale 0.15s',
              }}
            >
              But we don&apos;t just score. We fix.
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
