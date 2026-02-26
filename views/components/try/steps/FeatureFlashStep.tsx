'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Mic, CheckCircle2, Activity } from 'lucide-react';

interface FeatureFlashStepProps {
  onNext: () => void;
}

export function FeatureFlashStep({ onNext }: FeatureFlashStepProps) {
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false]);
  const [showCta, setShowCta] = useState(false);
  const wpmAnimRef = useRef<number | null>(null);

  // Animate metrics over ~5 seconds
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // WPM ramps up 0 -> 145 over 3s with smooth easing
    const startTime = performance.now();
    const animateWpm = (now: number) => {
      const progress = Math.min((now - startTime) / 3000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWpm(Math.round(145 * eased));
      if (progress < 1) wpmAnimRef.current = requestAnimationFrame(animateWpm);
    };
    wpmAnimRef.current = requestAnimationFrame(animateWpm);

    // Filler detected at 1.5s and 3s
    timers.push(setTimeout(() => setFillerCount(1), 1500));
    timers.push(setTimeout(() => setFillerCount(2), 3000));

    // Checklist items check off progressively
    const checklistLabels = ['Problem stated', 'Solution introduced', 'Traction mentioned', 'Ask defined'];
    checklistLabels.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setChecklist(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 1200 * (i + 1)));
    });

    // Show CTA after animations
    timers.push(setTimeout(() => setShowCta(true), 5000));

    return () => {
      timers.forEach(clearTimeout);
      if (wpmAnimRef.current) cancelAnimationFrame(wpmAnimRef.current);
    };
  }, []);

  const checklistLabels = ['Problem stated', 'Solution introduced', 'Traction mentioned', 'Ask defined'];

  const wpmColor = wpm >= 130 && wpm <= 160 ? '#22c55e' : wpm > 160 ? '#ef4444' : 'var(--text-secondary)';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <p
        className="text-sm font-medium uppercase tracking-wider mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        What happens when you record
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* WPM + Fillers */}
        <div className="flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Activity size={14} style={{ color: wpmColor }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>WPM</span>
            </div>
            <span
              className="text-3xl font-bold tabular-nums transition-colors duration-300"
              style={{ color: wpmColor }}
            >
              {wpm}
            </span>
          </div>
          <div className="w-px h-10" style={{ backgroundColor: 'var(--border-color)' }} />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <Mic size={14} style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Fillers</span>
            </div>
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
            >
              {fillerCount}
            </span>
          </div>
        </div>

        {/* Realtime checklist */}
        <div
          className="rounded-xl border p-4 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Realtime checklist
          </p>
          {checklistLabels.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-2 transition-all duration-300"
              style={{
                opacity: checklist[i] ? 1 : 0.4,
                transform: checklist[i] ? 'translateX(0)' : 'translateX(-4px)',
              }}
            >
              <CheckCircle2
                size={16}
                style={{ color: checklist[i] ? '#22c55e' : 'var(--text-muted)' }}
              />
              <span
                className="text-sm"
                style={{ color: checklist[i] ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
        style={{
          backgroundColor: '#ff5941',
          opacity: showCta ? 1 : 0,
          transform: showCta ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        Now you try
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
