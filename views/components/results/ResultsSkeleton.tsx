'use client';

import { AnalysisStepIndicator } from './AnalysisStepIndicator';

function ShimmerBlock({
  height = '1rem',
  width = '100%',
  rounded = 'rounded-lg',
}: {
  height?: string;
  width?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`${rounded} results-skeleton-shimmer`}
      style={{
        height,
        width,
        backgroundColor: 'rgba(255, 89, 65, 0.06)',
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(255,89,65,0.08) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function ResultsSkeleton({ startedAt }: { startedAt?: string }) {
  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-4 pr-1">
      {/* Header skeleton */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShimmerBlock height="2.5rem" width="2.5rem" rounded="rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <ShimmerBlock height="1.25rem" width="10rem" />
            <ShimmerBlock height="0.75rem" width="7rem" />
          </div>
        </div>
        <div className="flex gap-2">
          <ShimmerBlock height="2rem" width="7rem" rounded="rounded-lg" />
          <ShimmerBlock height="2rem" width="5rem" rounded="rounded-lg" />
        </div>
      </header>

      {/* Score hero skeleton */}
      <div
        className="rounded-2xl border p-6 flex flex-col items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <ShimmerBlock height="7rem" width="7rem" rounded="rounded-full" />
        <ShimmerBlock height="1.5rem" width="14rem" />
        <ShimmerBlock height="0.875rem" width="20rem" />
      </div>

      {/* Rubric 2x2 grid skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <ShimmerBlock height="0.75rem" width="60%" />
            <ShimmerBlock height="2rem" width="3rem" rounded="rounded-lg" />
            <ShimmerBlock height="0.625rem" width="90%" />
            <ShimmerBlock height="0.625rem" width="75%" />
          </div>
        ))}
      </div>

      {/* Top fixes skeleton */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <ShimmerBlock height="0.75rem" width="6rem" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <ShimmerBlock height="1.5rem" width="1.5rem" rounded="rounded-lg" />
            <div className="flex-1 flex flex-col gap-1.5">
              <ShimmerBlock height="0.875rem" width="80%" />
              <ShimmerBlock height="0.75rem" width="60%" />
            </div>
          </div>
        ))}
      </div>

      {/* Step indicator */}
      <AnalysisStepIndicator startedAt={startedAt} />

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}
