'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Brain,
  BarChart3,
  Lightbulb,
  Rocket,
  Check,
  AudioLines,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AnalyzingOverlayProps {
  isVisible: boolean;
  warning?: string | null;
}

export function AnalyzingOverlay({ isVisible, warning }: AnalyzingOverlayProps) {
  const [step, setStep] = useState(0);
  const [entered, setEntered] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const { t } = useTranslation();

  const ANALYSIS_STEPS = [
    { label: t.analysis.steps.processing, icon: FileText, duration: '~2s' },
    { label: t.analysis.steps.analyzing, icon: Brain, duration: '~5s' },
    { label: t.analysis.steps.scoring, icon: BarChart3, duration: '~4s' },
    { label: t.analysis.steps.generating, icon: Lightbulb, duration: '~3s' },
    { label: t.analysis.steps.preparing, icon: Rocket, duration: '~1s' },
  ];

  // Stagger step transitions with simulated timing
  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      setEntered(false);
      setStepProgress(0);
      return;
    }
    // Fade in
    requestAnimationFrame(() => setEntered(true));

    const timers = [
      setTimeout(() => setStep(1), 2500),
      setTimeout(() => setStep(2), 7000),
      setTimeout(() => setStep(3), 11000),
      setTimeout(() => setStep(4), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  // Animate progress within each step
  useEffect(() => {
    if (!isVisible) return;
    setStepProgress(0);
    const raf = requestAnimationFrame(() => {
      setStepProgress(0);
      // Smoothly animate to ~90% (never fully complete until next step)
      const timer = setTimeout(() => setStepProgress(92), 50);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(raf);
  }, [step, isVisible]);

  if (!isVisible) return null;

  const overallProgress = Math.min(((step / ANALYSIS_STEPS.length) * 100) + (stepProgress / ANALYSIS_STEPS.length), 98);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Glassmorphic backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(10, 10, 12, 0.72)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        }}
      />

      {/* Ambient glow behind card */}
      <div
        className="absolute analyze-ambient-drift"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 89, 65, 0.08) 0%, rgba(255, 170, 51, 0.04) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main card */}
      <div
        className="relative z-10 flex flex-col items-center w-full max-w-md mx-6"
        style={{
          transform: entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          opacity: entered ? 1 : 0,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.5s ease 0.1s',
        }}
      >
        {/* Waveform orb */}
        <div className="relative mb-10">
          {/* Outer ring pulse */}
          <div
            className="absolute inset-0 rounded-full analyze-ring-pulse"
            style={{
              width: '88px',
              height: '88px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(255, 89, 65, 0.2)',
            }}
          />
          <div
            className="absolute rounded-full analyze-ring-pulse"
            style={{
              width: '112px',
              height: '112px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(255, 89, 65, 0.08)',
              animationDelay: '0.5s',
            }}
          />

          {/* Main orb */}
          <div
            className="relative w-16 h-16 rounded-full flex items-center justify-center analyze-orb-breathe"
            style={{
              background: 'linear-gradient(135deg, #ff5941 0%, #ff7a33 50%, #ffaa33 100%)',
              boxShadow: '0 0 40px rgba(255, 89, 65, 0.35), 0 0 80px rgba(255, 170, 51, 0.15), inset 0 -2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <AudioLines size={24} color="#fff" className="analyze-icon-pulse" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div
          className="text-center mb-8"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.5s ease 0.3s',
          }}
        >
          <h2
            className="text-base font-semibold tracking-tight mb-1"
            style={{ color: 'rgba(255, 255, 255, 0.92)' }}
          >
            {t.analysis.analyzingTitle}
          </h2>
          <p
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            {t.analysis.analyzingSubtitle}
          </p>
        </div>
        {warning ? (
          <div
            className="w-full rounded-lg px-3 py-2 mb-6 text-[11px]"
            style={{
              color: '#ffaa33',
              backgroundColor: 'rgba(255, 170, 51, 0.12)',
              border: '1px solid rgba(255, 170, 51, 0.3)',
            }}
          >
            {warning}
          </div>
        ) : null}

        {/* Steps */}
        <div className="w-full flex flex-col gap-1.5 mb-8">
          {ANALYSIS_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            const isPending = i > step;

            return (
              <div
                key={i}
                className="relative"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i * 0.08}s`,
                }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255, 89, 65, 0.08)'
                      : isDone
                        ? 'rgba(34, 197, 94, 0.04)'
                        : 'transparent',
                    border: isActive
                      ? '1px solid rgba(255, 89, 65, 0.15)'
                      : '1px solid transparent',
                    transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {/* Icon container */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500"
                    style={{
                      backgroundColor: isDone
                        ? 'rgba(34, 197, 94, 0.12)'
                        : isActive
                          ? 'rgba(255, 89, 65, 0.12)'
                          : 'rgba(255, 255, 255, 0.04)',
                      transform: isDone ? 'scale(1)' : isActive ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {isDone ? (
                      <div className="analyze-check-pop">
                        <Check size={13} style={{ color: '#22c55e' }} strokeWidth={3} />
                      </div>
                    ) : isActive ? (
                      <div className="analyze-icon-spin-slow">
                        <Icon size={13} style={{ color: '#ff5941' }} strokeWidth={2} />
                      </div>
                    ) : (
                      <Icon
                        size={13}
                        style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                        strokeWidth={2}
                      />
                    )}
                  </div>

                  {/* Label + progress */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[13px] font-medium block transition-colors duration-300"
                      style={{
                        color: isDone
                          ? 'rgba(255, 255, 255, 0.4)'
                          : isActive
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {s.label}
                    </span>

                    {/* Micro progress bar for active step */}
                    {isActive && (
                      <div
                        className="h-[2px] rounded-full mt-1.5 overflow-hidden"
                        style={{ backgroundColor: 'rgba(255, 89, 65, 0.1)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${stepProgress}%`,
                            background: 'linear-gradient(90deg, #ff5941, #ffaa33)',
                            transition: 'width 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {isDone && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: 'rgba(34, 197, 94, 0.6)' }}
                      >
                        {t.common.done}
                      </span>
                    )}
                    {isActive && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full analyze-dot-bounce" style={{ backgroundColor: '#ff5941', animationDelay: '0ms' }} />
                          <div className="w-1 h-1 rounded-full analyze-dot-bounce" style={{ backgroundColor: '#ff5941', animationDelay: '150ms' }} />
                          <div className="w-1 h-1 rounded-full analyze-dot-bounce" style={{ backgroundColor: '#ff5941', animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    {isPending && (
                      <span
                        className="text-[10px]"
                        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                      >
                        {s.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div
          className="w-full"
          style={{
            opacity: entered ? 1 : 0,
            transition: 'opacity 0.5s ease 0.7s',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              {t.analysis.overallProgress}
            </span>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
          >
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${overallProgress}%`,
                background: 'linear-gradient(90deg, #ff5941, #ff7a33, #ffaa33)',
                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Shimmer effect on progress bar */}
              <div
                className="absolute inset-0 analyze-progress-shimmer"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  width: '50%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
