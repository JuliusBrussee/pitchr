'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SOLUTIONS } from '@/config/solutions';

const DESCRIPTIONS: Record<string, string> = {
  'elevator-pitch': 'Master your 30-second pitch',
  'vc-pitch': 'Structure for VC meetings',
  'hackathon-pitch': 'Win demo day presentations',
  'university': 'Ace academic presentations',
  'startup-competition': 'Own the competition stage',
};

export function SolutionsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleOpen = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        (containerRef.current?.querySelector('.solutions-dropdown-trigger') as HTMLElement)?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div
      className="solutions-dropdown"
      ref={containerRef}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        className="solutions-dropdown-trigger nav-link"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Solutions
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`solutions-dropdown-panel ${open ? 'open' : ''}`} role="menu">
        {SOLUTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/solutions/${s.slug}`}
            className="solutions-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <div className="solutions-dropdown-item-content">
              <span className="solutions-dropdown-item-label">{s.label}</span>
              <span className="solutions-dropdown-item-desc">{DESCRIPTIONS[s.slug] || s.tagline.slice(0, 40)}</span>
            </div>
            <span className="solutions-dropdown-item-duration">{s.duration}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
