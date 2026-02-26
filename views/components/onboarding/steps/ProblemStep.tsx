'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface ProblemStepProps {
  onNext: () => void;
}

const LINES = [
  'You practice alone.',
  'You guess what\'s wrong.',
  'You walk into the room hoping.',
];

export function ProblemStep({ onNext }: ProblemStepProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showPivot, setShowPivot] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 600 * (i + 1)));
    });
    timers.push(setTimeout(() => setShowPivot(true), 600 * LINES.length + 600));
    timers.push(setTimeout(() => setShowCta(true), 600 * LINES.length + 1000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="space-y-4 mb-8">
        {LINES.map((line, i) => (
          <p
            key={i}
            className="text-2xl md:text-3xl font-semibold transition-all duration-500 ease-out"
            style={{
              color: 'var(--text-primary)',
              opacity: i < visibleLines ? 1 : 0,
              transform: i < visibleLines ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <p
        className="text-2xl md:text-3xl font-semibold transition-all duration-500 ease-out mb-8"
        style={{
          color: '#ff5941',
          opacity: showPivot ? 1 : 0,
          transform: showPivot ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        Pitchr replaces hope with data.
      </p>

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
        Next
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
