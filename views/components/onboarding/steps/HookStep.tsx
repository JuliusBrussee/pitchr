'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface HookStepProps {
  onNext: () => void;
}

export function HookStep({ onNext }: HookStepProps) {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowSubtitle(true), 900);
    const t3 = setTimeout(() => setShowCta(true), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <h1
        className="text-4xl md:text-5xl font-bold leading-tight transition-all duration-700 ease-out"
        style={{
          color: 'var(--text-primary)',
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        Most pitches fail in the first{' '}
        <span style={{ color: '#ff5941' }}>30 seconds</span>.
      </h1>

      <p
        className="text-lg mt-4 transition-all duration-500 ease-out"
        style={{
          color: 'var(--text-secondary)',
          opacity: showSubtitle ? 1 : 0,
          transform: showSubtitle ? 'translateY(0)' : 'translateY(8px)',
        }}
      >
        Yours doesn&apos;t have to.
      </p>

      <button
        onClick={onNext}
        className="flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: '#ff5941',
          opacity: showCta ? 1 : 0,
          transform: showCta ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, scale 0.15s',
        }}
      >
        Show me why
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
