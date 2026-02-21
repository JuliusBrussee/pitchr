# Live Session View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full Live Session page with sidebar navigation, webcam/slide canvas, AI companion (SiriBubble), and real-time metrics panel — with light/dark mode and reactive aura background.

**Architecture:** 5 client components + 2 hooks orchestrated by a session page. A `ThemeProvider` wraps the app for light/dark mode + reactive aura. A `useSessionState` hook provides shared context for orb state, metrics, and media mode. A `useMediaStream` hook manages real webcam/mic access.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, existing SiriBubble component (Three.js/R3F)

**Install required:** `lucide-react` for icons (lightweight, tree-shakeable, Tailwind-friendly)

---

## Task 1: Install lucide-react Icon Library

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npm install lucide-react`
Expected: Added to dependencies in package.json

**Step 2: Verify installation**

Run: `npm ls lucide-react`
Expected: Shows lucide-react version in dependency tree

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react icon library"
```

---

## Task 2: ThemeProvider — Light/Dark Mode + Reactive Aura

**Files:**
- Create: `views/components/ThemeProvider.tsx`
- Modify: `app/layout.tsx` (wrap children with ThemeProvider)
- Modify: `app/globals.css` (add theme CSS custom properties)

**Step 1: Add theme CSS variables to globals.css**

In `app/globals.css`, add after `@import "tailwindcss";`:

```css
@import "tailwindcss";

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-surface: rgba(255, 255, 255, 0.72);
  --bg-surface-hover: rgba(255, 255, 255, 0.85);
  --border-color: rgba(0, 0, 0, 0.08);
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --blur-strength: 20px;
  --aura-color: rgba(107, 33, 168, 0.06);
  --aura-secondary: rgba(37, 99, 235, 0.04);
}

.dark {
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-surface: rgba(255, 255, 255, 0.06);
  --bg-surface-hover: rgba(255, 255, 255, 0.10);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --blur-strength: 16px;
  --aura-color: rgba(107, 33, 168, 0.10);
  --aura-secondary: rgba(37, 99, 235, 0.06);
}
```

**Step 2: Create ThemeProvider component**

Create `views/components/ThemeProvider.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { OrbState } from '@/views/components/SiriBubble';

// Aura color mappings matching SiriBubble states
const AURA_COLORS: Record<OrbState, { primary: string; secondary: string }> = {
  idle:     { primary: 'rgba(107,33,168,0.06)',  secondary: 'rgba(37,99,235,0.04)' },
  active:   { primary: 'rgba(6,182,212,0.06)',   secondary: 'rgba(59,130,246,0.04)' },
  positive: { primary: 'rgba(34,197,94,0.06)',   secondary: 'rgba(16,185,129,0.04)' },
  negative: { primary: 'rgba(239,68,68,0.08)',   secondary: 'rgba(249,115,22,0.04)' },
  neutral:  { primary: 'rgba(234,179,8,0.06)',   secondary: 'rgba(245,158,11,0.04)' },
};

const DARK_AURA_COLORS: Record<OrbState, { primary: string; secondary: string }> = {
  idle:     { primary: 'rgba(107,33,168,0.10)',  secondary: 'rgba(37,99,235,0.06)' },
  active:   { primary: 'rgba(6,182,212,0.10)',   secondary: 'rgba(59,130,246,0.06)' },
  positive: { primary: 'rgba(34,197,94,0.10)',   secondary: 'rgba(16,185,129,0.06)' },
  negative: { primary: 'rgba(239,68,68,0.12)',   secondary: 'rgba(249,115,22,0.06)' },
  neutral:  { primary: 'rgba(234,179,8,0.10)',   secondary: 'rgba(245,158,11,0.06)' },
};

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  orbState: 'idle',
  setOrbState: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>('idle');

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const auraMap = isDark ? DARK_AURA_COLORS : AURA_COLORS;
  const aura = auraMap[orbState];

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, orbState, setOrbState }}>
      <div
        className="min-h-screen transition-colors duration-700"
        style={{
          backgroundColor: isDark ? '#0a0a0a' : '#f0f0f3',
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 20% 50%, ${aura.primary}, transparent),
            radial-gradient(ellipse 60% 80% at 80% 50%, ${aura.secondary}, transparent)
          `,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

**Step 3: Update app/layout.tsx**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/views/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Pitchr',
  description: 'AI-powered pitch battle platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4: Verify dev server starts without errors**

Run: `npm run dev` (check terminal for errors, then stop)

**Step 5: Commit**

```bash
git add app/globals.css views/components/ThemeProvider.tsx app/layout.tsx
git commit -m "feat: add ThemeProvider with light/dark mode and reactive aura background"
```

---

## Task 3: useMediaStream Hook — Webcam/Mic Access

**Files:**
- Create: `hooks/useMediaStream.ts`

**Step 1: Create the hook**

Create `hooks/useMediaStream.ts`:

```ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMediaStreamReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMic: () => void;
  error: string | null;
}

export function useMediaStream(): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize media stream
  useEffect(() => {
    let active = true;
    let currentStream: MediaStream | null = null;

    async function startStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        currentStream = mediaStream;
        setStream(mediaStream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to access media devices');
        }
      }
    }

    startStream();

    return () => {
      active = false;
      currentStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Sync video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(prev => !prev);
    }
  }, [stream]);

  const toggleMic = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(prev => !prev);
    }
  }, [stream]);

  return { stream, videoRef, isCameraOn, isMicOn, toggleCamera, toggleMic, error };
}
```

**Step 2: Commit**

```bash
git add hooks/useMediaStream.ts
git commit -m "feat: add useMediaStream hook for webcam/mic access"
```

---

## Task 4: useSessionState Hook — Shared Session Context

**Files:**
- Create: `hooks/useSessionState.ts`

**Step 1: Create the hook**

Create `hooks/useSessionState.ts`:

```ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { OrbState } from '@/views/components/SiriBubble';

export interface MetricValues {
  wpm: number;
  fillerWords: number;
  conciseness: number;  // 0-10
  clarity: number;      // 0-10
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'completed' | 'partial' | 'uncovered';
}

export interface InsightEntry {
  id: string;
  text: string;
  timestamp: Date;
  type: 'positive' | 'suggestion' | 'neutral';
}

export interface SpeechBubble {
  id: string;
  text: string;
  expiresAt: number;
}

export interface SessionState {
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  metrics: MetricValues;
  checklist: ChecklistItem[];
  insights: InsightEntry[];
  speechBubbles: SpeechBubble[];
  isSessionActive: boolean;
  startSession: () => void;
  stopSession: () => void;
}

const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Introduction & hook', status: 'completed' },
  { id: '2', label: 'Problem statement', status: 'partial' },
  { id: '3', label: 'Solution overview', status: 'uncovered' },
  { id: '4', label: 'Market opportunity', status: 'uncovered' },
  { id: '5', label: 'Business model', status: 'uncovered' },
  { id: '6', label: 'Traction & metrics', status: 'uncovered' },
  { id: '7', label: 'Team', status: 'uncovered' },
  { id: '8', label: 'The ask', status: 'uncovered' },
];

const COACH_MESSAGES = [
  "Great eye contact! Keep it up.",
  "Try to slow down a bit.",
  "Take a deep breath.",
  "Look at the camera.",
  "Sit up straight!",
  "You're doing great!",
  "Try to vary your tone.",
  "Good pace!",
  "Remember to smile.",
  "Strong delivery!",
];

const MOCK_INSIGHTS: InsightEntry[] = [
  { id: '1', text: 'Strong opening — direct and confident', timestamp: new Date(), type: 'positive' },
  { id: '2', text: 'Consider adding a specific metric to support your claim', timestamp: new Date(), type: 'suggestion' },
];

export function useSessionState(): SessionState {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [metrics, setMetrics] = useState<MetricValues>({
    wpm: 0,
    fillerWords: 0,
    conciseness: 0,
    clarity: 0,
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(MOCK_CHECKLIST);
  const [insights, setInsights] = useState<InsightEntry[]>(MOCK_INSIGHTS);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate metrics updating when session is active
  useEffect(() => {
    if (!isSessionActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      return;
    }

    // Simulate WPM and metrics changes
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        wpm: Math.min(200, Math.max(80, prev.wpm + (Math.random() - 0.45) * 10)),
        fillerWords: prev.fillerWords + (Math.random() > 0.7 ? 1 : 0),
        conciseness: Math.min(10, Math.max(0, prev.conciseness + (Math.random() - 0.4) * 0.5)),
        clarity: Math.min(10, Math.max(0, prev.clarity + (Math.random() - 0.4) * 0.5)),
      }));

      // Randomly progress checklist
      setChecklist(prev => {
        const idx = prev.findIndex(item => item.status !== 'completed');
        if (idx === -1 || Math.random() > 0.15) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: updated[idx].status === 'uncovered' ? 'partial' : 'completed',
        };
        return updated;
      });

      // Randomly cycle orb states
      if (Math.random() > 0.85) {
        const states: OrbState[] = ['active', 'positive', 'neutral'];
        setOrbState(states[Math.floor(Math.random() * states.length)]);
      }
    }, 2000);

    // Coach speech bubbles
    bubbleIntervalRef.current = setInterval(() => {
      const msg = COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)];
      const bubble: SpeechBubble = {
        id: Date.now().toString(),
        text: msg,
        expiresAt: Date.now() + 4000,
      };
      setSpeechBubbles(prev => [...prev, bubble]);
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
    };
  }, [isSessionActive]);

  // Clean up expired speech bubbles
  useEffect(() => {
    if (speechBubbles.length === 0) return;
    const timer = setTimeout(() => {
      setSpeechBubbles(prev => prev.filter(b => b.expiresAt > Date.now()));
    }, 1000);
    return () => clearTimeout(timer);
  }, [speechBubbles]);

  const startSession = useCallback(() => {
    setIsSessionActive(true);
    setOrbState('active');
    setMetrics({ wpm: 120, fillerWords: 0, conciseness: 6, clarity: 7 });
    setChecklist(MOCK_CHECKLIST);
    setInsights(MOCK_INSIGHTS);
    setSpeechBubbles([]);
  }, []);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    setOrbState('idle');
  }, []);

  return {
    orbState,
    setOrbState,
    metrics,
    checklist,
    insights,
    speechBubbles,
    isSessionActive,
    startSession,
    stopSession,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useSessionState.ts
git commit -m "feat: add useSessionState hook with simulated metrics and coach bubbles"
```

---

## Task 5: AppSidebar Component

**Files:**
- Create: `views/components/AppSidebar.tsx`

**Step 1: Create the AppSidebar**

Create `views/components/AppSidebar.tsx`:

```tsx
'use client';

import {
  LayoutDashboard,
  Radio,
  Clock,
  BarChart3,
  FolderOpen,
  Settings,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/views/components/ThemeProvider';

interface AppSidebarProps {
  activePage: string;
  onStartSession: () => void;
  isSessionActive: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'session', label: 'Live Session', icon: Radio },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const TOOL_ITEMS = [
  { id: 'deck', label: 'Deck Manager', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ activePage, onStartSession, isSessionActive }: AppSidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside
      className="flex flex-col h-full w-60 rounded-2xl p-4 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Logo + Theme Toggle */}
      <div className="flex items-center justify-between mb-6 px-2">
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Pitchr
        </span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backdropFilter: isActive ? `blur(var(--blur-strength))` : undefined,
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 h-px" style={{ backgroundColor: 'var(--border-color)' }} />

      {/* Tools */}
      <nav className="flex flex-col gap-1">
        <span className="px-3 text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          Tools
        </span>
        {TOOL_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Start Session CTA */}
      <button
        onClick={onStartSession}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 ${
          isSessionActive
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400'
        }`}
        style={{
          boxShadow: isSessionActive
            ? '0 0 20px rgba(239,68,68,0.3)'
            : '0 0 20px rgba(107,33,168,0.3)',
        }}
      >
        <Play size={16} fill="currentColor" />
        {isSessionActive ? 'End Session' : 'Start Session'}
      </button>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/AppSidebar.tsx
git commit -m "feat: add AppSidebar with nav, tools, theme toggle, and session CTA"
```

---

## Task 6: SessionCanvas Component

**Files:**
- Create: `views/components/SessionCanvas.tsx`

**Step 1: Create the SessionCanvas**

Create `views/components/SessionCanvas.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';
import { OrbState } from '@/views/components/SiriBubble';
import { SpeechBubble } from '@/hooks/useSessionState';

interface SessionCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMic: () => void;
  orbState: OrbState;
  orbIntensity: number;
  speechBubbles: SpeechBubble[];
  isSessionActive: boolean;
}

export function SessionCanvas({
  videoRef,
  isCameraOn,
  isMicOn,
  toggleCamera,
  toggleMic,
  orbState,
  orbIntensity,
  speechBubbles,
  isSessionActive,
}: SessionCanvasProps) {
  const [focusMode, setFocusMode] = useState<'slides' | 'camera'>('slides');

  // In mic-only mode (camera off), always show slides as primary
  const effectiveFocus = !isCameraOn ? 'slides' : focusMode;

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      {/* Media Controls */}
      <div className="flex items-center justify-center gap-2">
        <MediaToggle
          icon={isCameraOn ? Video : VideoOff}
          isActive={isCameraOn}
          onClick={toggleCamera}
          label="Camera"
        />
        <MediaToggle
          icon={isMicOn ? Mic : MicOff}
          isActive={isMicOn}
          onClick={toggleMic}
          label="Microphone"
        />
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative flex-1 rounded-2xl overflow-hidden border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
          minHeight: '400px',
        }}
      >
        {/* Primary View */}
        {effectiveFocus === 'slides' ? (
          <SlideViewer />
        ) : (
          <CameraView videoRef={videoRef} isFocused />
        )}

        {/* Webcam Overlay (bottom-right) — only when camera is on and slides are focused */}
        {isCameraOn && effectiveFocus === 'slides' && (
          <button
            onClick={() => setFocusMode('camera')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on camera"
          >
            <CameraView videoRef={videoRef} isFocused={false} />
          </button>
        )}

        {/* Slide overlay (bottom-right) — when camera is focused */}
        {isCameraOn && effectiveFocus === 'camera' && (
          <button
            onClick={() => setFocusMode('slides')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on slides"
          >
            <SlideViewerMini />
          </button>
        )}

        {/* SiriBubble (top-right) */}
        {isSessionActive && (
          <div className="absolute top-4 right-4 z-10">
            <SiriBubble state={orbState} intensity={orbIntensity} size="sm" />
          </div>
        )}

        {/* Speech Bubbles */}
        <div className="absolute top-4 right-20 z-10 flex flex-col gap-2 max-w-xs">
          {speechBubbles.map(bubble => (
            <SpeechBubbleChip key={bubble.id} text={bubble.text} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function MediaToggle({
  icon: Icon,
  isActive,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ size?: number }>;
  isActive: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-all duration-200 border"
      style={{
        backgroundColor: isActive ? 'var(--bg-surface)' : 'rgba(239,68,68,0.15)',
        borderColor: isActive ? 'var(--border-color)' : 'rgba(239,68,68,0.3)',
        color: isActive ? 'var(--text-primary)' : '#ef4444',
        backdropFilter: `blur(var(--blur-strength))`,
      }}
      aria-label={label}
    >
      <Icon size={18} />
    </button>
  );
}

function SlideViewer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Monitor size={48} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Upload or generate your deck
        </p>
        <button
          className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          Upload Slides
        </button>
      </div>
    </div>
  );
}

function SlideViewerMini() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Monitor size={24} style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}

function CameraView({
  videoRef,
  isFocused,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFocused: boolean;
}) {
  return (
    <video
      ref={isFocused ? videoRef : undefined}
      autoPlay
      muted
      playsInline
      className={`${isFocused ? 'absolute inset-0' : ''} w-full h-full object-cover`}
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}

function SpeechBubbleChip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="px-3 py-2 rounded-full text-xs font-medium border transition-all duration-500"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      }}
    >
      {text}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/SessionCanvas.tsx
git commit -m "feat: add SessionCanvas with slide viewer, webcam overlay, SiriBubble, and speech bubbles"
```

---

## Task 7: MetricsPanel Component

**Files:**
- Create: `views/components/MetricsPanel.tsx`

**Step 1: Create the MetricsPanel**

Create `views/components/MetricsPanel.tsx`:

```tsx
'use client';

import { Check, Circle, Minus, Sparkles } from 'lucide-react';
import { MetricValues, ChecklistItem, InsightEntry } from '@/hooks/useSessionState';

interface MetricsPanelProps {
  metrics: MetricValues;
  checklist: ChecklistItem[];
  insights: InsightEntry[];
  isSessionActive: boolean;
}

export function MetricsPanel({ metrics, checklist, insights, isSessionActive }: MetricsPanelProps) {
  return (
    <aside
      className="flex flex-col w-80 rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Live Summary */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Live Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="WPM" value={isSessionActive ? Math.round(metrics.wpm) : '—'} />
          <MetricCard label="Filler Words" value={isSessionActive ? metrics.fillerWords : '—'} accent={metrics.fillerWords > 5 ? 'red' : undefined} />
          <MetricGauge label="Conciseness" value={isSessionActive ? metrics.conciseness : 0} max={10} />
          <MetricGauge label="Clarity" value={isSessionActive ? metrics.clarity : 0} max={10} />
        </div>
      </div>

      {/* Pitch Checklist */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Pitch Checklist
        </h3>
        <div className="flex flex-col gap-1.5">
          {checklist.map(item => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Live Insights */}
      <div className="p-4 flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Sparkles size={12} />
          Live Insights
        </h3>
        <div className="flex flex-col gap-2">
          {!isSessionActive && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Start a session to receive live feedback.
            </p>
          )}
          {isSessionActive && insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* --- Sub-components --- */

function MetricCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div
        className="text-xl font-bold tabular-nums transition-colors duration-300"
        style={{ color: accent === 'red' ? '#ef4444' : 'var(--text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricGauge({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {value > 0 ? value.toFixed(1) : '—'}
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: pct > 70 ? '#22c55e' : pct > 40 ? '#eab308' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const iconMap = {
    completed: <Check size={14} className="text-green-500" />,
    partial: <Minus size={14} className="text-amber-500" />,
    uncovered: <Circle size={14} style={{ color: 'var(--text-muted)' }} />,
  };

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {iconMap[item.status]}
      </div>
      <span
        className="text-sm transition-colors duration-300"
        style={{
          color: item.status === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
          textDecoration: item.status === 'completed' ? 'line-through' : undefined,
          opacity: item.status === 'uncovered' ? 0.6 : 1,
        }}
      >
        {item.label}
      </span>
    </div>
  );
}

function InsightCard({ insight }: { insight: InsightEntry }) {
  const colorMap = {
    positive: '#22c55e',
    suggestion: '#3b82f6',
    neutral: 'var(--text-secondary)',
  };

  return (
    <div
      className="rounded-lg p-2.5 border text-xs transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: '3px',
        borderLeftColor: colorMap[insight.type],
      }}
    >
      <p style={{ color: 'var(--text-primary)' }}>{insight.text}</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/MetricsPanel.tsx
git commit -m "feat: add MetricsPanel with live stats, pitch checklist, and insights feed"
```

---

## Task 8: Session Page — Wire Everything Together

**Files:**
- Create: `app/(app)/session/page.tsx`

**Step 1: Create the session page**

Create `app/(app)/session/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { AppSidebar } from '@/views/components/AppSidebar';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useTheme } from '@/views/components/ThemeProvider';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const { setOrbState } = useTheme();

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  const handleSessionToggle = () => {
    if (session.isSessionActive) {
      session.stopSession();
    } else {
      session.startSession();
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      <AppSidebar
        activePage="session"
        onStartSession={handleSessionToggle}
        isSessionActive={session.isSessionActive}
      />
      <SessionCanvas
        videoRef={media.videoRef}
        isCameraOn={media.isCameraOn}
        isMicOn={media.isMicOn}
        toggleCamera={media.toggleCamera}
        toggleMic={media.toggleMic}
        orbState={session.orbState}
        orbIntensity={0.6}
        speechBubbles={session.speechBubbles}
        isSessionActive={session.isSessionActive}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
      />
    </div>
  );
}
```

**Step 2: Create the session route directory if needed**

Run: `mkdir -p app/\(app\)/session`

**Step 3: Verify dev server runs and navigate to /session**

Run: `npm run dev`
Navigate to: `http://localhost:3000/session`
Expected: 3-column layout renders — sidebar, canvas with webcam prompt, metrics panel

**Step 4: Commit**

```bash
git add app/\(app\)/session/page.tsx
git commit -m "feat: add Session page wiring sidebar, canvas, and metrics panel"
```

---

## Task 9: Webcam Video Ref Fix — Shared Stream

The `CameraView` sub-component in `SessionCanvas` needs a fix: when camera is in the mini overlay, it should also show the video stream (not just the focused view). We need to clone the stream to a second video element.

**Files:**
- Modify: `views/components/SessionCanvas.tsx`

**Step 1: Fix the CameraView to use srcObject directly**

In `SessionCanvas.tsx`, update `CameraView` component to accept `stream` instead of relying on `videoRef` (which can only be attached to one element):

Replace the `CameraView` function and update the parent to pass `stream`:

In the `SessionCanvasProps` interface, add:
```tsx
stream: MediaStream | null;
```

Replace both `<CameraView videoRef={videoRef} ...>` usages:
- Primary: `<CameraView stream={stream} isFocused />`
- Overlay: `<CameraView stream={stream} isFocused={false} />`

Update the `CameraView` function:
```tsx
function CameraView({
  stream,
  isFocused,
}: {
  stream: MediaStream | null;
  isFocused: boolean;
}) {
  const localRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localRef.current && stream) {
      localRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={localRef}
      autoPlay
      muted
      playsInline
      className={`${isFocused ? 'absolute inset-0' : ''} w-full h-full object-cover`}
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
```

Add `useRef` to the imports at the top of the file.

Also update `SessionPage` to pass `stream={media.stream}` to `SessionCanvas`.

**Step 2: Verify camera shows in both primary and overlay positions**

Navigate to `/session`, grant camera permission, verify:
- Camera shows in primary or overlay position
- Clicking overlay swaps focus

**Step 3: Commit**

```bash
git add views/components/SessionCanvas.tsx app/\(app\)/session/page.tsx
git commit -m "fix: share webcam stream to both primary and overlay camera views"
```

---

## Task 10: Polish — Microinteractions & Final Touches

**Files:**
- Modify: `app/globals.css` (add keyframe animations)
- Modify: Various components for polish

**Step 1: Add custom animations to globals.css**

Add to `app/globals.css`:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(107,33,168,0.3); }
  50% { box-shadow: 0 0 30px rgba(107,33,168,0.5); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Step 2: Apply pulse-glow to Start Session button**

In `AppSidebar.tsx`, add `animate-pulse-glow` class to the Start Session button when not active.

**Step 3: Apply fade-in-up to insight cards**

In `MetricsPanel.tsx`, add `animate-fade-in-up` class to `InsightCard` wrapper div.

**Step 4: Verify all animations work**

Navigate to `/session`, start a session, verify:
- Start button pulses when idle
- Insight cards animate in
- Speech bubbles fade in and slide up
- Aura background shifts color with orb state
- Theme toggle switches light/dark with smooth transition

**Step 5: Commit**

```bash
git add app/globals.css views/components/AppSidebar.tsx views/components/MetricsPanel.tsx
git commit -m "feat: add microinteractions — pulse glow, fade-in-up, and animation classes"
```

---

## Task 11: Verify Build

**Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run tests**

Run: `npm test`
Expected: Existing SiriBubble tests still pass

**Step 3: Fix any issues found**

Address any build errors or test failures.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build/test issues"
```

---

## Summary

| Task | Component | Description |
|------|-----------|-------------|
| 1 | Dependencies | Install lucide-react |
| 2 | ThemeProvider | Light/dark mode + reactive aura |
| 3 | useMediaStream | Webcam/mic hook |
| 4 | useSessionState | Session metrics, checklist, bubbles |
| 5 | AppSidebar | Navigation, tools, CTA |
| 6 | SessionCanvas | Slides, webcam, SiriBubble, controls |
| 7 | MetricsPanel | Stats, checklist, insights |
| 8 | Session Page | Wire all components |
| 9 | Video Fix | Share stream to both views |
| 10 | Polish | Animations and microinteractions |
| 11 | Verify | Build + tests |
