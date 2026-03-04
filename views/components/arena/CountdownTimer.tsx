'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  durationSec: number;
  onComplete: () => void;
  label?: string;
  accentColor?: string;
}

export function CountdownTimer({
  durationSec,
  onComplete,
  label = 'Time Remaining',
  accentColor = '#ff5941',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(durationSec);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const left = Math.max(0, durationSec - elapsed);
    setRemaining(left);

    if (left <= 0) {
      onCompleteRef.current();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [durationSec]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [tick]);

  const progress = remaining / durationSec;
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  /* SVG ring dimensions */
  const SIZE = 140;
  const STROKE = 6;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE * (1 - progress);

  const isLow = remaining <= 10;
  const ringColor = isLow ? '#e63b26' : accentColor;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>

      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>

        {/* Center time */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-3xl font-bold tabular-nums ${isLow ? 'animate-pulse' : ''}`}
            style={{ color: isLow ? '#e63b26' : 'var(--text-primary)' }}
          >
            {display}
          </span>
        </div>
      </div>
    </div>
  );
}
