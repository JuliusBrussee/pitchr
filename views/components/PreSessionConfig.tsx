'use client';

import { useState } from 'react';
import { ModeSegmentedControl } from '@/views/components/ModeSegmentedControl';
import { DurationSlider } from '@/views/components/DurationSlider';
import {
  DURATION_SLIDER_MIN,
  DURATION_SLIDER_MAX,
  DURATION_SLIDER_STEP,
} from '@/config/modes';
import type { PitchMode } from '@/types/pitch';

interface PreSessionConfigProps {
  mode: PitchMode;
  onModeChange: (mode: PitchMode) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  isCollapsed: boolean;
  disabled?: boolean;
}

function formatTarget(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PreSessionConfig({
  mode,
  onModeChange,
  duration,
  onDurationChange,
  isCollapsed,
  disabled,
}: PreSessionConfigProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="config-collapse flex-shrink-0"
      style={{
        maxHeight: isCollapsed ? '0px' : '120px',
        opacity: isCollapsed ? 0 : 1,
        marginBottom: isCollapsed ? 0 : undefined,
        transform: isCollapsed ? 'translateY(-8px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), margin-bottom 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <div
        className="config-strip rounded-xl border px-4 py-3 flex items-center gap-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: isHovered ? 'rgba(255, 89, 65, 0.15)' : 'var(--border-color)',
          boxShadow: isHovered
            ? '0 0 20px rgba(255, 89, 65, 0.04), 0 1px 3px rgba(0, 0, 0, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'border-color 0.3s ease, box-shadow 0.4s ease',
        }}
      >
        <div className="flex-shrink-0" style={{ minWidth: '220px' }}>
          <ModeSegmentedControl value={mode} onChange={onModeChange} disabled={disabled} />
        </div>

        <div
          className="text-xs font-semibold tabular-nums whitespace-nowrap flex-shrink-0 px-2 py-1 rounded-md"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          Target: {formatTarget(duration)}
        </div>

        <div className="flex-1 min-w-[120px]">
          <DurationSlider
            value={duration}
            onChange={onDurationChange}
            min={DURATION_SLIDER_MIN}
            max={DURATION_SLIDER_MAX}
            step={DURATION_SLIDER_STEP}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
