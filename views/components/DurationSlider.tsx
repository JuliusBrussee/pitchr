'use client';

import { useState, useRef, useEffect } from 'react';

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function DurationSlider({ value, onChange, min, max, step, disabled }: DurationSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const [isDragging, setIsDragging] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setJustChanged(true);
      const t = setTimeout(() => setJustChanged(false), 200);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="slider-root flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {formatDuration(min)}
        </span>
        <span
          className="duration-badge text-xs font-semibold tabular-nums px-2.5 py-0.5 rounded-lg"
          style={{
            color: '#ff5941',
            backgroundColor: 'rgba(255, 89, 65, 0.1)',
            border: '1px solid rgba(255, 89, 65, 0.15)',
            boxShadow: justChanged ? '0 0 10px rgba(255, 89, 65, 0.2)' : '0 0 0 rgba(255, 89, 65, 0)',
            transform: justChanged ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
          }}
        >
          {formatDuration(value)}
        </span>
        <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {formatDuration(max)}
        </span>
      </div>
      <div className="slider-track-wrapper relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className="duration-slider w-full"
          aria-label={`Target duration: ${formatDuration(value)}`}
        />
      </div>
      <style jsx>{`
        .duration-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 5px;
          border-radius: 3px;
          outline: none;
          background: linear-gradient(
            to right,
            #ff5941 0%,
            #ffaa33 ${pct}%,
            var(--border-color) ${pct}%,
            var(--border-color) 100%
          );
          transition: height 0.2s ease;
          cursor: pointer;
        }
        .duration-slider:hover {
          height: 6px;
        }
        .duration-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${isDragging ? '22px' : '18px'};
          height: ${isDragging ? '22px' : '18px'};
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ff7a66, #ff5941);
          cursor: grab;
          box-shadow: ${isDragging
            ? '0 0 16px rgba(255, 89, 65, 0.5), 0 0 4px rgba(255, 89, 65, 0.3)'
            : '0 0 8px rgba(255, 89, 65, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'};
          border: 2px solid rgba(255, 255, 255, 0.25);
          transition: width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                      height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease;
        }
        .duration-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(255, 89, 65, 0.5), 0 0 4px rgba(255, 89, 65, 0.3);
        }
        .duration-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        .duration-slider::-moz-range-thumb {
          width: ${isDragging ? '22px' : '18px'};
          height: ${isDragging ? '22px' : '18px'};
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ff7a66, #ff5941);
          cursor: grab;
          box-shadow: ${isDragging
            ? '0 0 16px rgba(255, 89, 65, 0.5), 0 0 4px rgba(255, 89, 65, 0.3)'
            : '0 0 8px rgba(255, 89, 65, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'};
          border: 2px solid rgba(255, 255, 255, 0.25);
          transition: width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                      height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease;
        }
        .duration-slider::-moz-range-thumb:active {
          cursor: grabbing;
        }
        .duration-slider:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .duration-slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }
        .duration-slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
