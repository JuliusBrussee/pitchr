'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, X, Loader2 } from 'lucide-react';
import { useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';

export function SidebarAnalysisIndicator() {
  const { activeRunId, activeRunStatus, stopTracking } = useAnalysisTracker();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = activeRunStatus === 'complete';
  const isFailed = activeRunStatus === 'failed';
  const isActive = Boolean(activeRunId) && (activeRunStatus === 'queued' || activeRunStatus === 'running' || isComplete || isFailed);

  // Auto-dismiss 5s after completion
  useEffect(() => {
    if (isComplete || isFailed) {
      dismissTimerRef.current = setTimeout(() => {
        stopTracking();
      }, 5_000);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isComplete, isFailed, stopTracking]);

  if (!isActive || !activeRunId) return null;

  const bgColor = isComplete
    ? '#22c55e'
    : isFailed
      ? '#ef4444'
      : undefined;

  const label = isComplete
    ? 'Results ready!'
    : isFailed
      ? 'Analysis failed'
      : 'Analyzing...';

  return (
    <Link
      href={`/results/${activeRunId}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-opacity hover:opacity-80 mb-1"
      style={{
        background: bgColor ?? 'linear-gradient(135deg, #ff5941, #ffaa33)',
        color: 'white',
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
        style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        {isComplete ? (
          <Check size={14} strokeWidth={3} />
        ) : isFailed ? (
          <X size={14} strokeWidth={3} />
        ) : (
          <Loader2 size={14} className="animate-spin" />
        )}
        {/* Pulsing dot badge for active state */}
        {!isComplete && !isFailed && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: '#ffaa33', border: '1.5px solid rgba(0,0,0,0.2)' }}
          />
        )}
      </div>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
