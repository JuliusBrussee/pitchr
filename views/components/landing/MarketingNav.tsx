'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/views/components/ThemeProvider';
import { PitchrLogo } from '@/views/components/PitchrLogo';
import { SolutionsDropdown } from '@/views/components/landing/SolutionsDropdown';

export function MarketingNav() {
  const pathname = usePathname() ?? '';
  const { isDark, setTheme } = useTheme();
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Landing page has its own server-rendered nav
  if (pathname === '/') return null;

  return (
    <nav className={`marketing-nav${scrolled ? ' scrolled' : ''}`} ref={navRef}>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <PitchrLogo size={18} />
          Pitchr
        </Link>
        <div className="nav-links">
          <SolutionsDropdown />
          <Link href="/#pricing" className="nav-link">
            Plans
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
          <Link href="/blog" className="nav-link">
            Journal
          </Link>
          <button
            className="theme-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Link href="/login" className="nav-cta">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
