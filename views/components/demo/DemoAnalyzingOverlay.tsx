'use client';

import { useEffect, useState, useRef } from 'react';
import { Sparkles, Check } from 'lucide-react';

const STAGES = [
  { label: 'Processing transcript', sub: 'Extracting key phrases and structure' },
  { label: 'Scoring rubric dimensions', sub: 'Evaluating across 5 areas' },
  { label: 'Generating ranked fixes', sub: 'Prioritizing improvements by impact' },
  { label: 'Building rewrite comparison', sub: 'Crafting alternative phrasing' },
  { label: 'Finalizing results', sub: 'Preparing your pitch report' },
];

interface DemoAnalyzingOverlayProps {
  active: boolean;
}

export function DemoAnalyzingOverlay({ active }: DemoAnalyzingOverlayProps) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setStage(0);
      setProgress(0);
      return;
    }

    let s = 0;
    timerRef.current = setInterval(() => {
      s++;
      if (s >= STAGES.length) {
        clearInterval(timerRef.current);
        return;
      }
      setStage(s);
    }, 500);

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min(elapsed / 2600, 1);
      setProgress((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(frameRef.current);
    };
  }, [active]);

  if (!active) return null;

  const ringR = 54;
  const circumference = 2 * Math.PI * ringR;
  const ringOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="demo-analyzing">
      {/* Ambient radial glow */}
      <div className="demo-analyzing__ambient" />

      {/* Floating particles */}
      <div className="demo-analyzing__particles">
        <div className="demo-analyzing__particle demo-analyzing__particle--1" />
        <div className="demo-analyzing__particle demo-analyzing__particle--2" />
        <div className="demo-analyzing__particle demo-analyzing__particle--3" />
        <div className="demo-analyzing__particle demo-analyzing__particle--4" />
        <div className="demo-analyzing__particle demo-analyzing__particle--5" />
        <div className="demo-analyzing__particle demo-analyzing__particle--6" />
      </div>

      {/* Central content */}
      <div className="demo-analyzing__content">
        {/* Orb assembly */}
        <div className="demo-analyzing__orb-wrap">
          {/* Spinning dashed rings */}
          <div className="demo-analyzing__spin-ring" />
          <div className="demo-analyzing__spin-ring demo-analyzing__spin-ring--inner" />

          {/* SVG progress ring */}
          <svg className="demo-analyzing__progress-ring" viewBox="0 0 128 128">
            <circle
              cx="64" cy="64" r={ringR}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"
            />
            <circle
              cx="64" cy="64" r={ringR}
              fill="none"
              stroke="url(#demo-analyzing-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
            <defs>
              <linearGradient id="demo-analyzing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5941" />
                <stop offset="100%" stopColor="#ffaa33" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core orb */}
          <div className="demo-analyzing__orb">
            <Sparkles size={26} />
          </div>
        </div>

        {/* Title */}
        <div className="demo-analyzing__title">Analyzing your pitch</div>

        {/* Step list */}
        <div className="demo-analyzing__steps">
          {STAGES.map((s, i) => {
            const isDone = i < stage;
            const isActive = i === stage;
            return (
              <div
                key={i}
                className={`demo-analyzing__step${isActive ? ' demo-analyzing__step--active' : ''}${isDone ? ' demo-analyzing__step--done' : ''}`}
              >
                <div className="demo-analyzing__step-indicator">
                  {isDone ? (
                    <Check size={10} strokeWidth={3} />
                  ) : isActive ? (
                    <div className="demo-analyzing__step-spinner" />
                  ) : (
                    <div className="demo-analyzing__step-dot" />
                  )}
                </div>
                <div className="demo-analyzing__step-text">
                  <span className="demo-analyzing__step-label">{s.label}</span>
                  {isActive && <span className="demo-analyzing__step-sub">{s.sub}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="demo-analyzing__bar">
          <div
            className="demo-analyzing__bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
