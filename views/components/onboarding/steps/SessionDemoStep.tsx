'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Activity, AlertCircle, Eye } from 'lucide-react';
import { GlassCard } from '@/views/components/ui';
import { SiriBubble } from '@/views/components/SiriBubble';

interface SessionDemoStepProps {
  onNext: () => void;
}

export function SessionDemoStep({ onNext }: SessionDemoStepProps) {
  const [wpm, setWpm] = useState(90);
  const [duration, setDuration] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [fillerFlash, setFillerFlash] = useState(false);
  const [calloutVisible, setCalloutVisible] = useState([false, false, false]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const cycleRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const CYCLE_DURATION = 8000;

  const startAnimations = useCallback(() => {
    // Reset state
    setWpm(90);
    setDuration(0);
    setFillers(0);
    setFillerFlash(false);

    const start = performance.now();
    startTimeRef.current = start;

    // WPM animation: 90 -> 142 over 4s
    const animateWpm = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / 4000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setWpm(Math.round(90 + (142 - 90) * eased));
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateWpm);
      }
    };
    animationRef.current = requestAnimationFrame(animateWpm);

    // Duration timer
    const durationTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 8; i++) {
      durationTimers.push(setTimeout(() => setDuration(i), i * 1000));
    }

    // Filler increments at 2s and 5s
    durationTimers.push(setTimeout(() => {
      setFillers(1);
      setFillerFlash(true);
      setTimeout(() => setFillerFlash(false), 300);
    }, 2000));
    durationTimers.push(setTimeout(() => {
      setFillers(2);
      setFillerFlash(true);
      setTimeout(() => setFillerFlash(false), 300);
    }, 5000));

    cycleRef.current = durationTimers;
  }, []);

  useEffect(() => {
    startAnimations();

    // Callout staggered reveals
    const c1 = setTimeout(() => setCalloutVisible([true, false, false]), 500);
    const c2 = setTimeout(() => setCalloutVisible([true, true, false]), 1200);
    const c3 = setTimeout(() => setCalloutVisible([true, true, true]), 1800);

    // Loop every 8s
    const loopInterval = setInterval(() => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cycleRef.current.forEach(clearTimeout);
      startAnimations();
    }, CYCLE_DURATION);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cycleRef.current.forEach(clearTimeout);
      clearTimeout(c1);
      clearTimeout(c2);
      clearTimeout(c3);
      clearInterval(loopInterval);
    };
  }, [startAnimations]);

  const formatDuration = (s: number) => `0:${String(s).padStart(2, '0')}`;

  const callouts = [
    { icon: Activity, label: 'Live WPM tracking' },
    { icon: AlertCircle, label: 'Filler word detection' },
    { icon: Eye, label: 'Engagement monitoring' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Mock session */}
        <GlassCard padding="md" animate={false}>
          {/* Camera viewport */}
          <div
            className="rounded-xl mb-4 flex items-center justify-center overflow-hidden"
            style={{
              aspectRatio: '16/9',
              backgroundColor: '#1a1a2e',
            }}
          >
            <div
              className="w-16 h-16 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(255,89,65,0.3) 0%, rgba(255,89,65,0.05) 70%, transparent 100%)',
              }}
            />
          </div>

          {/* Orb */}
          <div className="flex justify-center mb-4">
            <div style={{ width: 120, height: 120 }}>
              <SiriBubble state="active" />
            </div>
          </div>

          {/* Metric counters */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{wpm}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Duration</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatDuration(duration)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fillers</p>
              <p
                className="text-lg font-bold tabular-nums transition-colors duration-300"
                style={{
                  color: fillerFlash ? '#ef4444' : 'var(--text-primary)',
                }}
              >
                {fillers}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Right: Description */}
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Record with your camera. The AI listens in real-time.
          </h2>

          <div className="space-y-3">
            {callouts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-500 ease-out"
                style={{
                  opacity: calloutVisible[i] ? 1 : 0,
                  transform: calloutVisible[i] ? 'translateX(0)' : 'translateX(12px)',
                }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#ff5941' }} />
                <c.icon size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] self-start"
            style={{ backgroundColor: '#ff5941' }}
          >
            What does it catch?
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
