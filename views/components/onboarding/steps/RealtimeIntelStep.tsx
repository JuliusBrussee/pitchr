'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { GlassCard } from '@/views/components/ui';

interface RealtimeIntelStepProps {
  onNext: () => void;
}

const CHECKLIST_ITEMS = [
  { label: 'Problem stated', checksAt: 1000 },
  { label: 'Solution introduced', checksAt: 2000 },
  { label: 'Traction mentioned', checksAt: null },
  { label: 'Ask defined', checksAt: null },
];

export function RealtimeIntelStep({ onNext }: RealtimeIntelStepProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [popItem, setPopItem] = useState<number | null>(null);
  const [wpmValue, setWpmValue] = useState(100);
  const [fillerCount, setFillerCount] = useState(0);
  const [fillerFlash, setFillerFlash] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const wpmAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Checklist animations
    CHECKLIST_ITEMS.forEach((item, i) => {
      if (item.checksAt !== null) {
        timers.push(setTimeout(() => {
          setCheckedItems((prev) => new Set([...prev, i]));
          setPopItem(i);
          setTimeout(() => setPopItem(null), 300);
        }, item.checksAt));
      }
    });

    // WPM gauge animation: 100 -> 145 over 3s
    const startTime = performance.now();
    const animateWpm = (now: number) => {
      const progress = Math.min((now - startTime) / 3000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWpmValue(Math.round(100 + 45 * eased));
      if (progress < 1) wpmAnimRef.current = requestAnimationFrame(animateWpm);
    };
    wpmAnimRef.current = requestAnimationFrame(animateWpm);

    // Filler counter: tick up at 1.5s, 3s, 4.5s
    [1500, 3000, 4500].forEach((delay, i) => {
      timers.push(setTimeout(() => {
        setFillerCount(i + 1);
        setFillerFlash(true);
        setTimeout(() => setFillerFlash(false), 300);
      }, delay));
    });

    // Subtitle
    timers.push(setTimeout(() => setShowSubtitle(true), 800));

    return () => {
      timers.forEach(clearTimeout);
      if (wpmAnimRef.current) cancelAnimationFrame(wpmAnimRef.current);
    };
  }, []);

  // WPM gauge position (80-200 range mapped to percentage)
  const gaugePosition = ((wpmValue - 80) / (200 - 80)) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Animated metrics panel */}
        <GlassCard padding="md" animate={false}>
          {/* Checklist */}
          <div className="space-y-3 mb-6">
            {CHECKLIST_ITEMS.map((item, i) => {
              const isChecked = checkedItems.has(i);
              const isPop = popItem === i;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: isChecked ? '#22c55e' : 'transparent',
                      border: isChecked ? '2px solid #22c55e' : '2px solid var(--border-color)',
                      transform: isPop ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {isChecked && <Check size={12} color="white" strokeWidth={3} />}
                  </div>
                  <span
                    className="text-sm transition-colors duration-300"
                    style={{ color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* WPM Gauge */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Speaking Pace</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{wpmValue} WPM</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden flex">
              {/* Red zone: too slow */}
              <div className="h-full" style={{ width: '41.67%', backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
              {/* Green zone: sweet spot (130-160) */}
              <div className="h-full" style={{ width: '25%', backgroundColor: 'rgba(34, 197, 94, 0.3)' }} />
              {/* Red zone: too fast */}
              <div className="h-full flex-1" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
            </div>
            {/* Indicator dot */}
            <div className="relative h-0">
              <div
                className="absolute -top-4 w-3 h-3 rounded-full transition-all duration-100"
                style={{
                  left: `${Math.min(Math.max(gaugePosition, 2), 98)}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: wpmValue >= 130 && wpmValue <= 160 ? '#22c55e' : '#ef4444',
                  boxShadow: '0 0 6px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>80</span>
              <span className="text-[10px] font-medium" style={{ color: '#22c55e' }}>Sweet Spot</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>200</span>
            </div>
          </div>

          {/* Filler Counter */}
          <div className="text-center py-3 rounded-xl transition-colors duration-300" style={{
            backgroundColor: fillerFlash ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
          }}>
            <p
              className="text-4xl font-bold tabular-nums transition-colors duration-300"
              style={{ color: fillerFlash ? '#ef4444' : 'var(--text-primary)' }}
            >
              {fillerCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Filler words detected</p>
          </div>
        </GlassCard>

        {/* Right: Description */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            While you speak, Pitchr tracks structure, delivery, and confidence.
          </h2>
          <p
            className="text-lg transition-all duration-500 ease-out"
            style={{
              color: 'var(--text-secondary)',
              opacity: showSubtitle ? 1 : 0,
              transform: showSubtitle ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            Every word counts.
          </p>

          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] self-start mt-4"
            style={{ backgroundColor: '#ff5941' }}
          >
            Then comes the score
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
