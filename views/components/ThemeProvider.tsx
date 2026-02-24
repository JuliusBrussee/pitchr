'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { OrbState } from '@/views/components/SiriBubble';

// Aura color mappings matching SiriBubble states
const AURA_COLORS: Record<OrbState, { primary: string; secondary: string }> = {
  idle:     { primary: 'rgba(255,89,65,0.05)',   secondary: 'rgba(255,170,51,0.03)' },
  active:   { primary: 'rgba(6,182,212,0.06)',   secondary: 'rgba(59,130,246,0.04)' },
  positive: { primary: 'rgba(34,197,94,0.06)',   secondary: 'rgba(16,185,129,0.04)' },
  negative: { primary: 'rgba(239,68,68,0.08)',   secondary: 'rgba(249,115,22,0.04)' },
  neutral:  { primary: 'rgba(234,179,8,0.06)',   secondary: 'rgba(245,158,11,0.04)' },
};

const DARK_AURA_COLORS: Record<OrbState, { primary: string; secondary: string }> = {
  idle:     { primary: 'rgba(255,89,65,0.08)',   secondary: 'rgba(255,170,51,0.05)' },
  active:   { primary: 'rgba(6,182,212,0.10)',   secondary: 'rgba(59,130,246,0.06)' },
  positive: { primary: 'rgba(34,197,94,0.10)',   secondary: 'rgba(16,185,129,0.06)' },
  negative: { primary: 'rgba(239,68,68,0.12)',   secondary: 'rgba(249,115,22,0.06)' },
  neutral:  { primary: 'rgba(234,179,8,0.10)',   secondary: 'rgba(245,158,11,0.06)' },
};

const STORAGE_KEY = 'pitchr-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  isDark: boolean;
  preference: ThemePreference;
  setTheme: (pref: ThemePreference) => void;
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  preference: 'system',
  setTheme: () => {},
  orbState: 'idle',
  setOrbState: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function resolveIsDark(pref: ThemePreference): boolean {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start false to match server HTML — the inline <head> script handles
  // .dark class before first paint, preventing flash.
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>('idle');

  // Sync from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const pref: ThemePreference = (stored === 'dark' || stored === 'light' || stored === 'system')
      ? stored
      : 'system';
    setPreference(pref);
    setIsDark(resolveIsDark(pref));
  }, []);

  // Listen for OS preference changes when set to "system"
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // Apply .dark class to <html> whenever isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setTheme = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    setPreference(pref);
    setIsDark(resolveIsDark(pref));
  }, []);

  const auraMap = isDark ? DARK_AURA_COLORS : AURA_COLORS;
  const aura = auraMap[orbState];

  return (
    <ThemeContext.Provider value={{ isDark, preference, setTheme, orbState, setOrbState }}>
      <div
        className="min-h-dvh transition-colors duration-700"
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
