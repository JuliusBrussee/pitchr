'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { PitchrLogo } from '@/views/components/PitchrLogo';
import { SessionDemo } from '@/views/components/landing-demos/SessionDemo';
import { ResultsDemo } from '@/views/components/landing-demos/ResultsDemo';
import { DashboardDemo } from '@/views/components/landing-demos/DashboardDemo';
import '@/app/(marketing)/landing-demos.css';

export function LandingDemosClient() {
  const navRef = useRef<HTMLElement>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  // Nav scroll effect
  const handleScroll = useCallback(() => {
    if (!navRef.current) return;
    navRef.current.classList.toggle('scrolled', window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Capture referral code
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) localStorage.setItem('pitchr_referral_code', refCode.trim());
    } catch { /* ignore */ }
  }, []);

  const scrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    document.getElementById(id)?.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'center' });
  };

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistStatus('loading');
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail.trim(),
          referrer: document.referrer || null,
          utm_source: params.get('utm_source') || null,
          utm_medium: params.get('utm_medium') || null,
          utm_campaign: params.get('utm_campaign') || null,
          landing_page: window.location.pathname,
          privacy_notice_acknowledged: true,
          privacy_notice_version: process.env.NEXT_PUBLIC_GDPR_POLICY_VERSION || '2026-03-04',
          newsletter_opt_in: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistStatus('success');
        setWaitlistMessage(data.message);
        setWaitlistEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="demos-landing">
      <div className="dl-noise" />

      {/* ═══ NAV ═══ */}
      <nav className="dl-nav" ref={navRef}>
        <div className="dl-container dl-nav-inner">
          <Link href="/" className="dl-nav-logo">
            <PitchrLogo size={18} />
            Pitchr
          </Link>
          <div className="dl-nav-links">
            <Link href="/delivery-rubric" className="dl-nav-link">Delivery Rubric</Link>
            <Link href="/scoring-logic" className="dl-nav-link">Scoring Logic</Link>
            <Link href="/growth-pricing" className="dl-nav-link">Growth Pricing</Link>
            <Link href="/blog" className="dl-nav-link">Journal</Link>
            <a href="#waitlist" className="dl-nav-cta" onClick={(e) => scrollTo(e, 'waitlist')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="dl-section dl-hero">
        <div className="dl-container">
          <div className="dl-hero-badge">
            <div className="dl-hero-badge-dot" />
            AI Pitch Coaching
          </div>

          <h1>
            Record a pitch.<br />
            <span style={{ color: 'var(--dl-accent)' }}>Get investor-grade feedback.</span>
          </h1>

          <p className="dl-hero-sub">
            AI pitch coaching that scores your pitch out of 100, gives you ranked fixes
            by impact, and rewrites your script — all in under 30 seconds.
          </p>
        </div>
      </section>

      {/* ═══ DEMO 1 — RECORD YOUR PITCH ═══ */}
      <SessionDemo />

      {/* ═══ DEMO 2 — YOUR RESULTS ═══ */}
      <ResultsDemo />

      {/* ═══ DEMO 3 — YOUR DASHBOARD ═══ */}
      <DashboardDemo />

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="dl-section" style={{ padding: '60px 0' }}>
        <div className="dl-container">
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              background: 'var(--dl-bg-elevated)',
              border: '1px solid var(--dl-border)',
              borderRadius: '14px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--dl-text-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
              &ldquo;I&apos;m used to building things — but pitching them was always the hard part.
              Pitchr is a product I can see myself coming back to every time I have a new idea to present.&rdquo;
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--dl-accent-glow)',
                border: '1px solid rgba(255, 89, 65, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--dl-accent)',
              }}>
                AE
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: 650 }}>Anthony Eid</div>
                <div style={{ fontSize: '12px', color: 'var(--dl-text-muted)' }}>Software Engineer @ Zed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="dl-section" style={{ padding: '40px 0', borderTop: '1px solid var(--dl-border)', borderBottom: '1px solid var(--dl-border)' }}>
        <div className="dl-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { value: '100', label: 'Point Scale' },
              { value: '5', label: 'Rubric Categories' },
              { value: '<30s', label: 'Analysis Time' },
              { value: '2', label: 'Pitch Modes' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '28px', fontWeight: 750, letterSpacing: '-0.03em', color: 'var(--dl-text)' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: 'var(--dl-text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WAITLIST ═══ */}
      <section className="dl-cta-section" id="waitlist">
        <div className="dl-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="dl-section-label" style={{ textAlign: 'center' }}>Early Access</div>
          <h2 className="dl-section-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
            Be the first to<br />
            <span style={{ color: 'var(--dl-accent)' }}>start scoring.</span>
          </h2>
          <p className="dl-section-subtitle" style={{ textAlign: 'center', margin: '0 auto 32px' }}>
            Join the waitlist to get early access to AI-powered pitch scoring,
            ranked fixes, and rewritten scripts.
          </p>

          {waitlistStatus === 'success' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--dl-green)', fontWeight: 600 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {waitlistMessage}
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="dl-waitlist-form">
              <div className="dl-waitlist-input-wrap">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  className="dl-waitlist-input"
                  disabled={waitlistStatus === 'loading'}
                />
                <button
                  type="submit"
                  className="dl-btn-primary"
                  disabled={waitlistStatus === 'loading'}
                  style={{ borderRadius: '8px', whiteSpace: 'nowrap' }}
                >
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--dl-text-muted)', marginTop: '12px' }}>
                By joining, you agree to the <Link href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Notice</Link>.
              </p>
              {waitlistStatus === 'error' && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--dl-red)', marginTop: '8px' }}>
                  {waitlistMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="dl-footer">
        <div className="dl-container dl-footer-inner">
          <div className="dl-footer-left">
            <PitchrLogo size={16} />
            Pitchr — AI Pitch Coach
          </div>
          <div className="dl-footer-links">
            <Link href="/about" className="dl-footer-link">About</Link>
            <Link href="/delivery-rubric" className="dl-footer-link">Delivery Rubric</Link>
            <Link href="/scoring-logic" className="dl-footer-link">Scoring Logic</Link>
            <Link href="/growth-pricing" className="dl-footer-link">Growth Pricing</Link>
            <Link href="/blog" className="dl-footer-link">Journal</Link>
            <Link href="/terms" className="dl-footer-link">Terms</Link>
            <Link href="/privacy" className="dl-footer-link">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
