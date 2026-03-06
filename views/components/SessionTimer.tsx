'use client';

import { useEffect, useRef, useState } from 'react';
import { OVERTIME_LIMIT_SECONDS } from '@/config/modes';

interface SessionTimerProps {
  elapsedSeconds: number;
  targetSeconds: number;
  overtimeLimit?: number;
  compact?: boolean;
}

function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTimerColor(progress: number): string {
  if (progress >= 1) return '#ef4444';
  if (progress >= 0.85) {
    // Smooth amber → red transition
    const t = (progress - 0.85) / 0.15;
    return lerpColor('#f59e0b', '#ef4444', t);
  }
  if (progress >= 0.75) {
    // Smooth green → amber transition
    const t = (progress - 0.75) / 0.1;
    return lerpColor('#22c55e', '#f59e0b', t);
  }
  return '#22c55e';
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function SessionTimer({
  elapsedSeconds,
  targetSeconds,
  overtimeLimit = OVERTIME_LIMIT_SECONDS,
  compact,
}: SessionTimerProps) {
  const progress = targetSeconds > 0 ? elapsedSeconds / targetSeconds : 0;
  const isOvertime = elapsedSeconds > targetSeconds;
  const overtimeSeconds = isOvertime ? Math.round(elapsedSeconds - targetSeconds) : 0;
  const cappedProgress = Math.min(progress, 1 + overtimeLimit / targetSeconds);

  const strokeColor = getTimerColor(progress);

  const size = compact ? 30 : 36;
  const strokeWidth = compact ? 2.5 : 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(cappedProgress, 1));

  // Tick marks for quarter intervals
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const inner = radius - 2;
    const outer = radius + 1;
    return {
      x1: size / 2 + Math.cos(rad) * inner,
      y1: size / 2 + Math.sin(rad) * inner,
      x2: size / 2 + Math.cos(rad) * outer,
      y2: size / 2 + Math.sin(rad) * outer,
    };
  });

  const glowOpacity = isOvertime ? 0.6 : progress >= 0.75 ? 0.3 : 0.15;
  const glowSize = isOvertime ? 8 : 4;

  return (
    <div className="session-timer flex items-center gap-1.5">
      <div className="timer-ring relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="flex-shrink-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <filter id="timer-glow">
              <feGaussianBlur stdDeviation={glowSize / 2} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
            opacity={0.6}
          />
          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="var(--border-color)"
              strokeWidth={0.8}
              opacity={0.5}
            />
          ))}
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            filter={progress >= 0.75 ? 'url(#timer-glow)' : undefined}
            opacity={glowOpacity + 0.4}
            style={{
              transition: 'stroke-dashoffset 0.8s linear, stroke 0.5s ease, opacity 0.5s ease',
            }}
          />
          {/* Bright progress arc on top */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s linear, stroke 0.5s ease',
            }}
          />
        </svg>
      </div>
      <span
        className="timer-text text-xs font-medium tabular-nums whitespace-nowrap"
        style={{
          color: strokeColor,
          transition: 'color 0.5s ease',
        }}
      >
        {formatTimer(elapsedSeconds)}
        {isOvertime && (
          <span className="overtime-badge" style={{ color: '#ef4444' }}>
            {' '}+{overtimeSeconds}s
          </span>
        )}
      </span>
      <style jsx>{`
        .timer-ring {
          animation: ${isOvertime ? 'timer-pulse 1.5s ease-in-out infinite' : 'none'};
        }
        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        .overtime-badge {
          animation: overtime-flash 1s ease-in-out infinite;
        }
        @keyframes overtime-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
