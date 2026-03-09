'use client';

import { useRef, useEffect, useState } from 'react';
import { PITCH_MODE_CONFIG } from '@/config/modes';
import type { PitchMode } from '@/types/pitch';

interface ModeSegmentedControlProps {
  value: PitchMode;
  onChange: (mode: PitchMode) => void;
  disabled?: boolean;
}

const MODES: PitchMode[] = ['elevator', 'vc_pitch', 'hackathon'];

export function ModeSegmentedControl({ value, onChange, disabled }: ModeSegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIndex = MODES.indexOf(value);
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    const btn = buttons[activeIndex];
    if (!btn) return;
    setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="segmented-control relative flex rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface-hover)',
        border: '1px solid var(--border-color)',
        padding: '3px',
      }}
      role="radiogroup"
      aria-label="Pitch mode"
    >
      {pillStyle && (
        <div
          className="segmented-pill absolute top-[3px] bottom-[3px] rounded-lg"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            backgroundColor: 'rgba(255, 89, 65, 0.12)',
            border: '1px solid rgba(255, 89, 65, 0.2)',
            boxShadow: '0 0 12px rgba(255, 89, 65, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.25s ease',
          }}
        />
      )}
      {MODES.map((mode) => {
        const config = PITCH_MODE_CONFIG[mode];
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(mode)}
            disabled={disabled}
            className="segmented-btn relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-lg"
            style={{
              color: isActive ? '#ff5941' : 'var(--text-muted)',
              transition: 'color 0.2s ease, transform 0.15s ease',
            }}
          >
            {config.label}
          </button>
        );
      })}
      <style jsx>{`
        .segmented-btn:not(:disabled):hover {
          color: var(--text-primary) !important;
        }
        .segmented-btn:not(:disabled):active {
          transform: scale(0.97);
        }
        .segmented-btn:not(:disabled) {
          cursor: pointer;
        }
        .segmented-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .segmented-btn[aria-checked="true"]:hover {
          color: #ff5941 !important;
        }
      `}</style>
    </div>
  );
}
