# Try-Before-Signup Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a public `/try` route that lets unauthenticated users experience the full pitch recording flow, see a fake scoring animation, then gates feedback behind an inline signup form — maximizing conversion through value-first onboarding.

**Architecture:** New `(public)` route group at `app/(public)/try/` with a `TryFlow` orchestrator component managing 7 steps. Reuses existing onboarding step components (HookStep, ProblemStep), media hooks (useMediaStream, useRecorder), and UI components (SiriBubble, GlassCard, CategoryBar). No API calls — recording is discarded, scores are demo data. Inline auth form reuses Supabase auth logic from existing login page.

**Tech Stack:** Next.js App Router, React hooks, Supabase Auth (client-side), CSS animations, existing UI component library.

**Design doc:** `docs/plans/2026-02-26-try-before-signup-design.md`

---

## Task 1: Create public route group and try page entry point

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/try/page.tsx`
- Modify: `lib/supabase/middleware.ts` (verify `/try` is not auth-gated)

**Step 1: Check middleware doesn't block /try**

Read `lib/supabase/middleware.ts` and confirm the matcher config. The `(public)` group should not be in the protected routes. If it is, add `/try` to the public allowlist.

**Step 2: Create the public layout**

```tsx
// app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

This is a minimal layout — no auth provider, no sidebar, no nav. Just renders children.

**Step 3: Create the try page**

```tsx
// app/(public)/try/page.tsx
'use client';

import { TryFlow } from '@/views/components/try/TryFlow';

export default function TryPage() {
  return (
    <div
      className="h-dvh w-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TryFlow />
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/(public)/
git commit -m "feat(try): add public route group and /try page entry point"
```

---

## Task 2: Create TryFlow orchestrator

**Files:**
- Create: `views/components/try/TryFlow.tsx`
- Create: `config/try-flow.ts`

**Step 1: Create the try flow config**

```tsx
// config/try-flow.ts
export const TRY_STEPS = [
  'hook',
  'problem',
  'feature-flash',
  'use-case',
  'record',
  'analysis',
  'gated-results',
] as const;

export type TryStep = typeof TRY_STEPS[number];

// Score shown in fake analysis (intentionally mediocre to create urgency)
export const TRY_DEMO_SCORE = 42;
```

**Step 2: Create the TryFlow orchestrator**

Model this after `views/components/onboarding/OnboardingFlow.tsx` but with the try-specific steps. Key differences:
- Uses `TRY_STEPS` instead of `ONBOARDING_STEPS`
- Stores selected mode in local state (not localStorage yet)
- No skip button (motivation is highest during onboarding — don't let them bail)
- Progress bar shows steps 1-4 only (hide recording/results from progress)
- Keyboard/touch navigation for educational steps (1-3), disabled during recording

```tsx
// views/components/try/TryFlow.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { TRY_STEPS } from '@/config/try-flow';
import { ProgressBar } from '@/views/components/onboarding/ProgressBar';
import { StepTransition } from '@/views/components/onboarding/StepTransition';
import { HookStep } from '@/views/components/onboarding/steps/HookStep';
import { ProblemStep } from '@/views/components/onboarding/steps/ProblemStep';
import { FeatureFlashStep } from './steps/FeatureFlashStep';
import { UseCaseStep } from './steps/UseCaseStep';
import { TryRecordingStep } from './steps/TryRecordingStep';
import { GatedResultsStep } from './steps/GatedResultsStep';
import type { PitchMode } from '@/types';

export function TryFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<PitchMode>('elevator');
  const touchStartX = useRef<number | null>(null);

  // Only show progress for educational steps (0-3), not recording/results
  const educationalSteps = 4;
  const isEducationalStep = currentStep < educationalSteps;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TRY_STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation (only for educational steps)
  useEffect(() => {
    if (!isEducationalStep) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goBack, isEducationalStep]);

  // Touch swipe (only for educational steps)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEducationalStep) return;
    touchStartX.current = e.touches[0].clientX;
  }, [isEducationalStep]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEducationalStep || touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goBack();
    }
    touchStartX.current = null;
  }, [goNext, goBack, isEducationalStep]);

  const handleModeSelect = useCallback((mode: PitchMode) => {
    setSelectedMode(mode);
    goNext();
  }, [goNext]);

  const renderStep = () => {
    switch (TRY_STEPS[currentStep]) {
      case 'hook': return <HookStep onNext={goNext} />;
      case 'problem': return <ProblemStep onNext={goNext} />;
      case 'feature-flash': return <FeatureFlashStep onNext={goNext} />;
      case 'use-case': return <UseCaseStep onSelect={handleModeSelect} />;
      case 'record': return <TryRecordingStep mode={selectedMode} onComplete={goNext} />;
      case 'analysis':
      case 'gated-results':
        return <GatedResultsStep mode={selectedMode} />;
      default: return null;
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isEducationalStep && (
        <ProgressBar
          currentStep={currentStep}
          totalSteps={educationalSteps}
        />
      )}
      <div className="flex-1 overflow-y-auto">
        <StepTransition stepKey={currentStep}>
          {renderStep()}
        </StepTransition>
      </div>
    </div>
  );
}
```

Note: The `analysis` and `gated-results` steps are handled by a single `GatedResultsStep` component that manages its own internal phases (analyzing → score reveal → gate). This is because they're one continuous animation sequence.

**Step 3: Check ProgressBar accepts optional onSkip**

Read `views/components/onboarding/ProgressBar.tsx`. If `onSkip` is required, make it optional since we don't want a skip button in the try flow.

**Step 4: Commit**

```bash
git add views/components/try/TryFlow.tsx config/try-flow.ts
git commit -m "feat(try): add TryFlow orchestrator and config"
```

---

## Task 3: Create FeatureFlashStep (merged demo preview)

**Files:**
- Create: `views/components/try/steps/FeatureFlashStep.tsx`

**Step 1: Build the component**

This is a compressed, single-screen version of `SessionDemoStep` + `RealtimeIntelStep`. It shows a quick animated preview of what happens during a session: SiriBubble + animated WPM + filler detection + realtime checklist — all on one screen, auto-advancing.

Reference `views/components/onboarding/steps/SessionDemoStep.tsx` for the WPM animation pattern and `views/components/onboarding/steps/RealtimeIntelStep.tsx` for the checklist/gauge pattern.

```tsx
// views/components/try/steps/FeatureFlashStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Mic, CheckCircle2, Activity } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';

interface FeatureFlashStepProps {
  onNext: () => void;
}

export function FeatureFlashStep({ onNext }: FeatureFlashStepProps) {
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false]);
  const [showCta, setShowCta] = useState(false);

  // Animate metrics over ~5 seconds
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // WPM ramps up 0 -> 145 over 3s
    const wpmSteps = [0, 45, 89, 112, 130, 138, 145];
    wpmSteps.forEach((val, i) => {
      timers.push(setTimeout(() => setWpm(val), i * 450));
    });

    // Filler detected at 1.5s and 3s
    timers.push(setTimeout(() => setFillerCount(1), 1500));
    timers.push(setTimeout(() => setFillerCount(2), 3000));

    // Checklist items check off progressively
    const checklistLabels = ['Problem stated', 'Solution introduced', 'Traction mentioned', 'Ask defined'];
    checklistLabels.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setChecklist(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 1200 * (i + 1)));
    });

    // Show CTA after animations
    timers.push(setTimeout(() => setShowCta(true), 5000));

    return () => timers.forEach(clearTimeout);
  }, []);

  const checklistLabels = ['Problem stated', 'Solution introduced', 'Traction mentioned', 'Ask defined'];

  const wpmColor = wpm >= 130 && wpm <= 160 ? '#22c55e' : wpm > 160 ? '#ef4444' : 'var(--text-secondary)';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <p
        className="text-sm font-medium uppercase tracking-wider mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        What happens when you record
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* SiriBubble + WPM */}
        <div className="flex items-center gap-6">
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            <SiriBubble state="active" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: wpmColor }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                WPM
              </span>
              <span
                className="text-lg font-bold tabular-nums transition-colors duration-300"
                style={{ color: wpmColor }}
              >
                {wpm}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mic size={14} style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Fillers
              </span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: fillerCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
              >
                {fillerCount}
              </span>
            </div>
          </div>
        </div>

        {/* Realtime checklist */}
        <div
          className="rounded-xl border p-4 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Realtime checklist
          </p>
          {checklistLabels.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-2 transition-all duration-300"
              style={{
                opacity: checklist[i] ? 1 : 0.4,
                transform: checklist[i] ? 'translateX(0)' : 'translateX(-4px)',
              }}
            >
              <CheckCircle2
                size={16}
                style={{ color: checklist[i] ? '#22c55e' : 'var(--text-muted)' }}
              />
              <span
                className="text-sm"
                style={{ color: checklist[i] ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: '#ff5941',
          opacity: showCta ? 1 : 0,
          transform: showCta ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, scale 0.15s',
        }}
      >
        Now you try
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/try/steps/FeatureFlashStep.tsx
git commit -m "feat(try): add FeatureFlashStep with animated metrics preview"
```

---

## Task 4: Create UseCaseStep (mode picker)

**Files:**
- Create: `views/components/try/steps/UseCaseStep.tsx`

**Step 1: Build the component**

```tsx
// views/components/try/steps/UseCaseStep.tsx
'use client';

import { Zap, Presentation } from 'lucide-react';
import type { PitchMode } from '@/types';

interface UseCaseStepProps {
  onSelect: (mode: PitchMode) => void;
}

const MODES = [
  {
    mode: 'elevator' as PitchMode,
    label: 'Elevator Pitch',
    description: '60-second intro to an investor',
    icon: Zap,
    timer: '1 min',
  },
  {
    mode: 'vc_pitch' as PitchMode,
    label: 'VC Pitch',
    description: 'Full fundraising pitch walkthrough',
    icon: Presentation,
    timer: '5 min',
  },
];

export function UseCaseStep({ onSelect }: UseCaseStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <h2
        className="text-2xl font-bold mb-2 text-center"
        style={{ color: 'var(--text-primary)' }}
      >
        What are you pitching?
      </h2>
      <p
        className="text-sm mb-8 text-center"
        style={{ color: 'var(--text-secondary)' }}
      >
        We&apos;ll set the timer and scoring rubric for you.
      </p>

      <div className="w-full max-w-sm space-y-3">
        {MODES.map(({ mode, label, description, icon: Icon, timer }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: 'rgba(255,89,65,0.1)' }}
            >
              <Icon size={20} style={{ color: '#ff5941' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-muted)',
              }}
            >
              {timer}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify PitchMode type exists**

Check `types/` directory for the `PitchMode` type. It should be `'elevator' | 'vc_pitch'`. If it's not exported from a central types file, check where it's defined and import from there.

**Step 3: Commit**

```bash
git add views/components/try/steps/UseCaseStep.tsx
git commit -m "feat(try): add UseCaseStep mode picker"
```

---

## Task 5: Create TryRecordingStep (full recording experience, no auth)

**Files:**
- Create: `views/components/try/steps/TryRecordingStep.tsx`

This is the most complex component. It provides the full recording experience (camera, mic, SiriBubble, timer, metrics display) without auth, STT, or upload.

**Step 1: Study the session page**

Read `app/(app)/session/page.tsx` carefully. Understand which hooks are used and which we can skip:
- **USE:** `useMediaStream` (camera/mic), `useRecorder` (recording blob)
- **SKIP:** `useSTT` (needs WebSocket server), `usePitchRun` (needs auth), head tracking, deck support

**Step 2: Build the component**

Since we skip STT (no WebSocket API available without auth), we can't get real WPM/fillers. Instead, we'll show animated metrics that respond to audio levels using the Web Audio API's `AnalyserNode` — the SiriBubble will pulse, and we'll fake WPM/filler counts that look realistic.

```tsx
// views/components/try/steps/TryRecordingStep.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Square } from 'lucide-react';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useRecorder } from '@/hooks/useRecorder';
import { SiriBubble } from '@/views/components/SiriBubble';
import type { PitchMode } from '@/types';

interface TryRecordingStepProps {
  mode: PitchMode;
  onComplete: () => void;
}

const MODE_DURATION = {
  elevator: 60,
  vc_pitch: 300,
};

export function TryRecordingStep({ mode, onComplete }: TryRecordingStepProps) {
  const { stream, isVideoEnabled, isAudioEnabled, toggleCamera, toggleMic, error: mediaError } = useMediaStream();
  const recorder = useRecorder();

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fakeWpm, setFakeWpm] = useState(0);
  const [fakeFillers, setFakeFillers] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const maxDuration = MODE_DURATION[mode];
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach stream to video preview
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Fake metrics based on audio energy
  const startAudioAnalysis = useCallback(() => {
    if (!stream) return;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    let wpmTarget = 0;
    let fillerTimer = 0;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const isSpeaking = avg > 20;

      // Fake WPM: ramp toward target when speaking, drift down when silent
      if (isSpeaking) {
        wpmTarget = 120 + Math.random() * 40; // 120-160 range
        fillerTimer += 1;
      } else {
        wpmTarget = Math.max(0, wpmTarget - 2);
      }

      setFakeWpm(prev => Math.round(prev + (wpmTarget - prev) * 0.08));

      // Fake filler: ~every 8-12 seconds of speaking
      if (fillerTimer > 500 && Math.random() < 0.01) {
        setFakeFillers(prev => prev + 1);
        fillerTimer = 0;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [stream]);

  const handleStart = useCallback(() => {
    if (!stream) return;
    recorder.startRecording(stream);
    setIsRecording(true);
    setHasStarted(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= maxDuration) {
          handleStop();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);

    startAudioAnalysis();
  }, [stream, recorder, maxDuration, startAudioAnalysis]);

  const handleStop = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    recorder.stopRecording(); // blob is discarded
    onComplete();
  }, [recorder, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const wpmColor = fakeWpm >= 130 && fakeWpm <= 160 ? '#22c55e' : fakeWpm > 160 ? '#ef4444' : 'var(--text-secondary)';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-6">
      {/* Camera preview or SiriBubble */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        {isVideoEnabled && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full rounded-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <SiriBubble state={isRecording ? 'active' : 'idle'} />
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <p
          className="text-4xl font-bold tabular-nums"
          style={{ color: elapsed >= maxDuration - 10 ? '#ef4444' : 'var(--text-primary)' }}
        >
          {formatTime(elapsed)}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {formatTime(maxDuration)} max
        </p>
      </div>

      {/* Live metrics (only show when recording) */}
      {isRecording && (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: wpmColor }}>
              {fakeWpm}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</p>
          </div>
          <div
            className="w-px h-8"
            style={{ backgroundColor: 'var(--border-color)' }}
          />
          <div className="text-center">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: fakeFillers > 3 ? '#ef4444' : fakeFillers > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
            >
              {fakeFillers}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fillers</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          className="flex items-center justify-center w-12 h-12 rounded-full border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: isAudioEnabled ? 'transparent' : 'rgba(239,68,68,0.1)',
          }}
        >
          {isAudioEnabled ? (
            <Mic size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <MicOff size={20} style={{ color: '#ef4444' }} />
          )}
        </button>

        {/* Start/Stop */}
        {!hasStarted ? (
          <button
            onClick={handleStart}
            disabled={!stream}
            className="flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#ff5941' }}
          >
            <Mic size={28} />
          </button>
        ) : isRecording ? (
          <button
            onClick={handleStop}
            className="flex items-center justify-center w-16 h-16 rounded-full text-white font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#ef4444' }}
          >
            <Square size={24} fill="white" />
          </button>
        ) : null}

        {/* Camera toggle */}
        <button
          onClick={toggleCamera}
          className="flex items-center justify-center w-12 h-12 rounded-full border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: isVideoEnabled ? 'transparent' : 'rgba(239,68,68,0.1)',
          }}
        >
          {isVideoEnabled ? (
            <Video size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <VideoOff size={20} style={{ color: '#ef4444' }} />
          )}
        </button>
      </div>

      {/* Permission error */}
      {mediaError && (
        <p className="text-sm text-center max-w-xs" style={{ color: '#ef4444' }}>
          {mediaError}
        </p>
      )}

      {/* Prompt */}
      {!hasStarted && !mediaError && (
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Hit record and give us your best {mode === 'elevator' ? '60-second' : '5-minute'} pitch.
          Don&apos;t overthink it — this is practice.
        </p>
      )}
    </div>
  );
}
```

**Important:** Check the exact API signatures of `useMediaStream` and `useRecorder`. The hook may return different property names (e.g., `error` vs `permissionError`, `isVideoEnabled` vs `cameraEnabled`). Adjust the component to match the actual hook interfaces.

**Step 3: Commit**

```bash
git add views/components/try/steps/TryRecordingStep.tsx
git commit -m "feat(try): add TryRecordingStep with full recording experience and fake metrics"
```

---

## Task 6: Create GatedResultsStep (fake analysis + blur gate + inline auth)

**Files:**
- Create: `views/components/try/steps/GatedResultsStep.tsx`

This is the conversion-critical component. It handles two internal phases:
1. **Analyzing** — SiriBubble + rubric dots animation + score counter (reuse logic from `ScoringDemoStep`)
2. **Gated** — Results blur behind frosted glass, inline auth form overlay

**Step 1: Build the component**

```tsx
// views/components/try/steps/GatedResultsStep.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Globe, Sparkles } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';
import { CategoryBar, ScoreBadge } from '@/views/components/ui';
import { getRubricColor } from '@/views/components/ui/colors';
import { DEMO_SCORES } from '@/config/onboarding';
import { TRY_DEMO_SCORE } from '@/config/try-flow';
import { createClient } from '@/lib/supabase/client';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { PitchMode } from '@/types';

interface GatedResultsStepProps {
  mode: PitchMode;
}

type Phase = 'analyzing' | 'score-reveal' | 'gated';

export function GatedResultsStep({ mode }: GatedResultsStepProps) {
  const router = useRouter();
  const onboarding = useOnboarding();
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [activeIndicator, setActiveIndicator] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
  const [showGate, setShowGate] = useState(false);

  // Auth state
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scoreAnimRef = useRef<number | null>(null);

  // Phase 1: Analyzing — sequential indicator dots
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_SCORES.rubric.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveIndicator(i), 700 * (i + 1)));
    });
    timers.push(setTimeout(() => setPhase('score-reveal'), 4000));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Phase 2: Score reveal — animate counter 0 → TRY_DEMO_SCORE
  useEffect(() => {
    if (phase !== 'score-reveal') return;
    const startTime = performance.now();
    const duration = 1500;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(TRY_DEMO_SCORE * eased));
      if (progress < 1) {
        scoreAnimRef.current = requestAnimationFrame(animate);
      } else {
        // Brief pause showing score, then gate drops
        setTimeout(() => {
          setPhase('gated');
          setTimeout(() => setShowGate(true), 100);
        }, 1200);
      }
    };
    scoreAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    };
  }, [phase]);

  // Auth handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
    }

    // Mark as came from try flow, then redirect
    onboarding.markCameFromTry(mode);
    router.push(`/session?mode=${mode}`);
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(`/session?mode=${mode}`)}`,
      },
    });
    if (error) setAuthError(error.message);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 py-8 overflow-hidden">
      {/* Background results (will be blurred) */}
      <div
        className="flex flex-col items-center gap-6 w-full max-w-lg transition-all duration-700"
        style={{
          filter: phase === 'gated' ? 'blur(20px)' : 'none',
          transform: phase === 'gated' ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {/* SiriBubble */}
        <div style={{ width: 120, height: 120 }}>
          <SiriBubble state={phase === 'analyzing' ? 'active' : 'negative'} />
        </div>

        {/* Analyzing indicators */}
        {phase === 'analyzing' && (
          <>
            <p
              className="text-lg font-medium animate-pulse"
              style={{ color: 'var(--text-secondary)' }}
            >
              Analyzing your pitch...
            </p>
            <div className="flex items-center gap-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <div
                  key={item.category}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= activeIndicator
                      ? getRubricColor(item.category)
                      : 'var(--border-color)',
                    transform: i === activeIndicator ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Score + results */}
        {(phase === 'score-reveal' || phase === 'gated') && (
          <>
            <p className="text-6xl font-bold tabular-nums" style={{ color: '#ef4444' }}>
              {displayScore}
            </p>
            <ScoreBadge score={TRY_DEMO_SCORE} showLabel size="md" />

            {/* Category bars (fake) */}
            <div className="w-full space-y-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <CategoryBar
                  key={item.category}
                  label={item.label}
                  score={item.score}
                  maxScore={item.maxScore}
                  color={getRubricColor(item.category)}
                  delay={i}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Gate overlay */}
      {phase === 'gated' && (
        <div
          className="absolute inset-0 flex items-center justify-center px-6 transition-all duration-500"
          style={{
            opacity: showGate ? 1 : 0,
            transform: showGate ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="mb-3" style={{ width: 48, height: 48 }}>
                <SiriBubble state="idle" />
              </div>
              <p className="text-3xl font-bold" style={{ color: '#ff5941' }}>
                {TRY_DEMO_SCORE}/100
              </p>
              <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
                We found 5 things to fix.
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Sparkles size={12} />
                Sign up to unlock your full feedback
              </p>
            </div>

            {/* Error */}
            {authError && (
              <div
                className="mb-4 rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {authError}
              </div>
            )}

            {/* Auth form */}
            <form onSubmit={handleAuth} className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#ff5941' }}
              >
                {isLoading
                  ? (isSignUp ? 'Creating account...' : 'Signing in...')
                  : (isSignUp ? 'Create account' : 'Sign in')
                }
              </button>
            </form>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  or
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleAuth}
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            >
              <Globe size={16} />
              Continue with Google
            </button>

            {/* Toggle sign up / sign in */}
            <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                className="font-medium hover:underline"
                style={{ color: '#ff5941' }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/try/steps/GatedResultsStep.tsx
git commit -m "feat(try): add GatedResultsStep with fake analysis animation and inline auth"
```

---

## Task 7: Update useOnboarding hook with try flow support

**Files:**
- Modify: `hooks/useOnboarding.ts`

**Step 1: Add `cameFromTry` flag and `markCameFromTry` method**

Read the current `hooks/useOnboarding.ts`. Add:
- `cameFromTry: boolean` to the stored state
- `markCameFromTry(mode: PitchMode)` method that sets `cameFromTry: true` and `preferredMode`

The stored localStorage shape should become:
```ts
{
  isComplete: boolean;
  displayName: string;
  preferredMode: PitchMode;
  cameFromTry: boolean;
}
```

**Step 2: Commit**

```bash
git add hooks/useOnboarding.ts
git commit -m "feat(try): add cameFromTry flag to useOnboarding hook"
```

---

## Task 8: Update setup page to handle try flow users

**Files:**
- Modify: `app/(app)/setup/page.tsx`

**Step 1: Add try flow shortcut**

Read the current setup page. Add logic: if `onboarding.cameFromTry` is true and user is authenticated, skip the full onboarding and either:
- Go directly to `/session?mode={preferredMode}` (if mode was already chosen in try flow)
- Show only `PersonalizationStep` (if we want them to set their name)

Since the try flow already chose a mode, and name will be captured later (or from Google profile), redirect directly:

```tsx
// In the setup page's useEffect:
if (onboarding.cameFromTry && user) {
  const mode = onboarding.preferredMode || 'elevator';
  onboarding.complete(user.user_metadata?.full_name || '', mode);
  router.replace(`/session?mode=${mode}`);
  return;
}
```

**Step 2: Commit**

```bash
git add app/(app)/setup/page.tsx
git commit -m "feat(try): skip full onboarding for users from try flow"
```

---

## Task 9: Verify ProgressBar accepts optional onSkip

**Files:**
- Modify: `views/components/onboarding/ProgressBar.tsx` (if needed)

**Step 1: Check the ProgressBar interface**

Read `views/components/onboarding/ProgressBar.tsx`. If `onSkip` is a required prop, make it optional:

```tsx
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;  // Make optional
}
```

Only render the skip button if `onSkip` is provided.

**Step 2: Commit (only if changes were needed)**

```bash
git add views/components/onboarding/ProgressBar.tsx
git commit -m "refactor: make ProgressBar onSkip optional for try flow reuse"
```

---

## Task 10: Verify middleware allows /try route

**Files:**
- Modify: `lib/supabase/middleware.ts` (if needed)

**Step 1: Check the middleware matcher**

Read `lib/supabase/middleware.ts`. Check how routes are matched:
- If it uses a positive matcher (only protects specific routes), `/try` should work automatically since it's in `(public)` group
- If it uses a negative matcher (protects everything except allowlist), add `/try` to the allowlist

Common patterns to look for:
```ts
// If matcher only applies to (app) routes, we're fine:
export const config = { matcher: ['/(app)/:path*'] }

// If matcher applies broadly, add exception:
// Add '/try' to the public routes list
```

**Step 2: Commit (only if changes were needed)**

```bash
git add lib/supabase/middleware.ts
git commit -m "fix: ensure /try route is publicly accessible"
```

---

## Task 11: Integration test — run the full flow

**Step 1: Start the dev server**

```bash
yarn dev
```

**Step 2: Manual walkthrough**

Open `http://localhost:3000/try` in a browser (incognito/private to ensure no auth). Walk through each step:

1. Hook step renders with animation
2. Problem step renders with staggered reveals
3. Feature flash step shows animated metrics preview
4. Use-case step shows two mode options, clicking one advances
5. Recording step requests camera/mic permissions, shows SiriBubble, timer works, metrics animate during speech
6. Stopping recording transitions to analyzing animation
7. Score counter animates up, then blur gate drops
8. Auth form is functional (email/password + Google button)
9. After signup, redirects to `/session?mode=X`

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(try): complete try-before-signup onboarding flow"
```

---

## Task 12: Add coach toast for returning try flow users

**Files:**
- Modify: `config/onboarding.ts`

**Step 1: Add a try-flow-specific coach toast**

Add to `COACH_TOASTS`:
```ts
'session-from-try': 'That was practice. Now let\'s get your real score — same pitch, real feedback.',
```

**Step 2: Wire the toast in session page**

In the session page, check if user `cameFromTry` and show this specific toast on first visit.

**Step 3: Commit**

```bash
git add config/onboarding.ts app/(app)/session/page.tsx
git commit -m "feat(try): add coach toast for users coming from try flow"
```
