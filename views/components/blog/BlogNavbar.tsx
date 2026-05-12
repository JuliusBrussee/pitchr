'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Monitor, ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/views/components/ThemeProvider';
import type { ThemePreference } from '@/views/components/ThemeProvider';

const NAV_LINKS = [
  { href: '/blog', label: 'Journal' },
  { href: '/', label: 'Home' },
  { href: '/#pricing', label: 'Pricing' },
];

const THEME_OPTIONS: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export function BlogNavbar() {
  const { preference, setTheme } = useTheme();
  const pathname = usePathname() ?? '';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on outside click (ref covers entire nav including hamburger)
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileMenuOpen]);

  const activeIndex = THEME_OPTIONS.findIndex((o) => o.value === preference);

  return (
    <nav ref={navRef} className={`blog-navbar ${isScrolled ? 'blog-navbar--scrolled' : ''}`}>
      <div className="blog-navbar-inner">
        {/* Logo */}
        <Link href="/blog" className="blog-navbar-logo">
          <span className="blog-navbar-logo-mark">P</span>
          <span className="blog-navbar-logo-text">The Pitch Journal</span>
        </Link>

        {/* Desktop links */}
        <div className="blog-navbar-links">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/blog'
              ? pathname === '/blog'
              : false;
            const isExternal = link.href.startsWith('/#');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`blog-navbar-link ${isActive ? 'blog-navbar-link--active' : ''}`}
              >
                {link.label}
                {isExternal && <ArrowUpRight size={11} className="blog-navbar-link-arrow" />}
              </Link>
            );
          })}
        </div>

        {/* Desktop theme toggle */}
        <div className="blog-navbar-actions">
          <div className="blog-theme-toggle" role="radiogroup" aria-label="Color theme">
            <div
              className="blog-theme-toggle-indicator"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = preference === option.value;
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${option.label} theme`}
                  className={`blog-theme-toggle-btn ${isActive ? 'blog-theme-toggle-btn--active' : ''}`}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          <Link href="/" className="blog-navbar-cta">
            Try Pitchr
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`blog-navbar-hamburger ${isMobileMenuOpen ? 'blog-navbar-hamburger--open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="blog-navbar-hamburger-line" />
          <span className="blog-navbar-hamburger-line" />
          <span className="blog-navbar-hamburger-line" />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`blog-navbar-mobile ${isMobileMenuOpen ? 'blog-navbar-mobile--open' : ''}`}
      >
        <div className="blog-navbar-mobile-links">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/blog' ? pathname === '/blog' : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`blog-navbar-mobile-link ${isActive ? 'blog-navbar-mobile-link--active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="blog-navbar-mobile-divider" />

        <div className="blog-navbar-mobile-theme">
          <span className="blog-navbar-mobile-theme-label">Theme</span>
          <div className="blog-theme-toggle" role="radiogroup" aria-label="Color theme">
            <div
              className="blog-theme-toggle-indicator"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
            />
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = preference === option.value;
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${option.label} theme`}
                  className={`blog-theme-toggle-btn ${isActive ? 'blog-theme-toggle-btn--active' : ''}`}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>

        <Link href="/" className="blog-navbar-mobile-cta">
          Try Pitchr
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </nav>
  );
}
