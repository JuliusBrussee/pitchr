'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Mic, CheckCircle2, Activity } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';

interface FeatureFlashStepProps {
  onNext: () => void;
}

export function FeatureFlashStep({ onNext }: FeatureFlashStepProps) {
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false]);
  const [showCta, setShowCta] = useState(false);

  // Animate metrics over ~5 seconds
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // WPM ramps up 0 -> 145 over 3s
    const wpmSteps = [0, 45, 89, 112, 130, 138, 145];
    wpmSteps.forEach((val, i) => {
      timers.push(setTimeout(() => setWpm(val), i * 450));
    });

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

    return () => timers.forEach(clearTimeout);
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
        {/* SiriBubble + WPM */}
        <div className="flex items-center gap-6">
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            <SiriBubble state="active" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: wpmColor }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                WPM
              </span>
              <span
                className="text-lg font-bold tabular-nums transition-colors duration-300"
                style={{ color: wpmColor }}
              >
                {wpm}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mic size={14} style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Fillers
              </span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
              >
                {fillerCount}
              </span>
            </div>
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
