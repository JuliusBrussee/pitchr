'use client';

import { useState, useEffect } from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Delays rendering of skeleton UI to prevent flicker on fast loads.
 * If data arrives within the delay window, skeletons are never shown.
 */
export function useDelayedLoading(loading: boolean, delayMs = 150): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), delayMs);
    return () => clearTimeout(timer);
  }, [loading, delayMs]);

  return showSkeleton;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--bg-surface-hover)' }}
    />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-28 mb-1.5" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    </div>
  );
}
