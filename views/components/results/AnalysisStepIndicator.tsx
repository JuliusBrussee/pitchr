'use client';

import { useEffect, useState } from 'react';
import { FileText, Brain, BarChart3, Lightbulb, Rocket } from 'lucide-react';

const ANALYSIS_STEPS = [
  { label: 'Processing transcript', icon: FileText, duration: '~3s' },
  { label: 'Analyzing structure & clarity', icon: Brain, duration: '~6s' },
  { label: 'Scoring rubric categories', icon: BarChart3, duration: '~5s' },
  { label: 'Generating fixes & rewrite', icon: Lightbulb, duration: '~5s' },
  { label: 'Preparing results', icon: Rocket, duration: '~2s' },
];

const EXTRA_WAIT_HINT_MS = 25_000;
const STEP_THRESHOLDS_MS = [0, 3_500, 9_000, 14_000, 19_000] as const;

function elapsedMs(startedAt?: string): number {
  if (!startedAt) return 0;
  return Math.max(0, Date.now() - new Date(startedAt).getTime());
}

function computeInitialStep(startedAt?: string): number {
  const elapsed = elapsedMs(startedAt);
  let step = 0;
  for (let i = 0; i < STEP_THRESHOLDS_MS.length; i++) {
    if (elapsed >= STEP_THRESHOLDS_MS[i]) step = i;
  }
  return Math.min(step, ANALYSIS_STEPS.length - 1);
}

export function AnalysisStepIndicator({ startedAt }: { startedAt?: string }) {
  const [step, setStep] = useState(() => computeInitialStep(startedAt));
  const [showExtraWait, setShowExtraWait] = useState(
    () => elapsedMs(startedAt) >= EXTRA_WAIT_HINT_MS,
  );

  useEffect(() => {
    const elapsed = elapsedMs(startedAt);
    const schedule: Array<[number, () => void]> = [
      [3_500, () => setStep(1)],
      [9_000, () => setStep(2)],
      [14_000, () => setStep(3)],
      [19_000, () => setStep(4)],
      [EXTRA_WAIT_HINT_MS, () => setShowExtraWait(true)],
    ];
    const timers = schedule
      .map(([threshold, fn]) => {
        const delay = threshold - elapsed;
        return delay > 0 ? setTimeout(fn, delay) : null;
      })
      .filter((t): t is ReturnType<typeof setTimeout> => t !== null);
    return () => timers.forEach(clearTimeout);
  }, [startedAt]);

  const current = ANALYSIS_STEPS[step] ?? ANALYSIS_STEPS[0];
  const Icon = current.icon;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
      style={{
        backgroundColor: 'rgba(255, 89, 65, 0.08)',
        border: '1px solid rgba(255, 89, 65, 0.15)',
        color: 'rgba(255, 255, 255, 0.7)',
      }}
    >
      {/* Spinner */}
      <div
        className="w-5 h-5 rounded-full border-2 flex-shrink-0 animate-spin"
        style={{
          borderColor: 'rgba(255, 89, 65, 0.2)',
          borderTopColor: '#ff5941',
        }}
      />
      <Icon size={14} style={{ color: '#ff5941' }} strokeWidth={2} className="flex-shrink-0" />
      <span className="flex-1 font-medium" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
        {current.label}
      </span>
      <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
        {showExtraWait ? 'Still working...' : `Step ${step + 1} of ${ANALYSIS_STEPS.length}`}
      </span>
    </div>
  );
}
