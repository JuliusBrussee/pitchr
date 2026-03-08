'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface StartSessionButtonProps {
  onClick: () => void;
  isSessionActive: boolean;
}

export function StartSessionButton({ onClick, isSessionActive }: StartSessionButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const counter = useRef(0);
  const busyRef = useRef(false);
  const { t } = useTranslation();

  const spawnRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++counter.current;
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setTimeout(() => { busyRef.current = false; }, 1000);
    spawnRipple(e);
    onClick();
  }, [onClick, spawnRipple]);

  if (isSessionActive) {
    return (
      <button
        onClick={handleClick}
        className="session-end-btn"
      >
        {ripples.map(r => (
          <span
            key={r.id}
            className="session-ripple session-ripple--red"
            style={{ left: r.x, top: r.y }}
          />
        ))}
        <span className="session-rec-dot" />
        <Pause size={13} fill="currentColor" />
        <span>{t.nav.pauseSession}</span>
      </button>
    );
  }

  return (
    <div className="session-start-wrap">
      <div className="session-start-glow" />
      <button
        onClick={handleClick}
        className="session-start-btn"
      >
        {ripples.map(r => (
          <span
            key={r.id}
            className="session-ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}
        <span className="session-start-btn__icon">
          <Play size={15} fill="currentColor" />
        </span>
        {t.nav.startSession}
      </button>
    </div>
  );
}
