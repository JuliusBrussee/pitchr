'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from '@/views/components/ThemeProvider';
import { LandingPricing } from '@/views/components/landing/LandingPricing';
import { LandingBlog } from '@/views/components/landing/LandingBlog';
import { HeroPresenterTiles } from '@/views/components/landing/HeroPresenterTiles';
import './landing.css';
import './blog/blog.css';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const { isDark, setTheme } = useTheme();
  const navRef = useRef<HTMLElement>(null);
  const radarPathRef = useRef<SVGPathElement>(null);
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const heroBgBaseRef = useRef<HTMLDivElement>(null);
  const heroPresenterRef = useRef<HTMLDivElement>(null);
  const heroSpotlightRef = useRef<HTMLDivElement>(null);
  const heroMicPulseRef = useRef<HTMLDivElement>(null);
  const heroScrollRef = useRef<HTMLDivElement>(null);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;

    setWaitlistStatus('loading');
    try {
      // Collect UTM params from current URL
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

  function scrollToWaitlist(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const handleScroll = useCallback(() => {
    if (!navRef.current) return;
    if (window.scrollY > 50) {
      navRef.current.classList.add('scrolled');
    } else {
      navRef.current.classList.remove('scrolled');
    }
  }, []);

  useEffect(() => {
    // Intersection Observer for reveals + SVG animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Radar chart: animate to perfect pentagon
            if (entry.target.id === 'radarReveal') {
              setTimeout(() => {
                radarPathRef.current?.setAttribute(
                  'd',
                  'M100,20 L176,75 L147,165 L53,165 L24,75 Z'
                );
              }, 300);
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.landing .reveal').forEach((el) => observer.observe(el));

    // Nav scroll effect
    window.addEventListener('scroll', handleScroll, { passive: true });

    // CTA hover glow tracking
    const ctaContainer = ctaContainerRef.current;
    const ctaGlow = ctaGlowRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ctaContainer || !ctaGlow) return;
      const rect = ctaContainer.getBoundingClientRect();
      ctaGlow.style.left = `${e.clientX - rect.left}px`;
      ctaGlow.style.top = `${e.clientY - rect.top}px`;
    };

    ctaContainer?.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      ctaContainer?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll]);

  useEffect(() => {
    const hero = heroSectionRef.current;
    const heroBase = heroBgBaseRef.current;
    const heroPresenter = heroPresenterRef.current;
    const heroSpotlight = heroSpotlightRef.current;
    const heroMicPulse = heroMicPulseRef.current;
    const heroInner = heroInnerRef.current;
    const heroScroll = heroScrollRef.current;

    if (
      !hero
      || !heroBase
      || !heroPresenter
      || !heroSpotlight
      || !heroMicPulse
      || !heroInner
      || !heroScroll
    ) {
      return;
    }

    type HeroMotionConfig = {
      scrub: number;
      baseDriftY: number;
      baseScale: number;
      presenterLeadX: number;
      presenterLiftY: number;
      presenterLeadScale: number;
      presenterLeadRotate: number;
      presenterExitX: number;
      presenterExitY: number;
      presenterExitScale: number;
      presenterExitAlpha: number;
      spotlightStart: number;
      spotlightPeak: number;
      spotlightScale: number;
      spotlightExit: number;
      textRiseY: number;
      textFadeTo: number;
    };

    const setupTimeline = (config: HeroMotionConfig) => {
      gsap.set(heroBase, {
        transformOrigin: '50% 50%',
        yPercent: 0,
        scale: 1,
      });
      gsap.set(heroPresenter, {
        transformOrigin: '72% 42%',
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale: 1,
        autoAlpha: 1,
      });
      gsap.set(heroSpotlight, {
        transformOrigin: '50% 50%',
        autoAlpha: config.spotlightStart,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
      });
      gsap.set(heroMicPulse, {
        autoAlpha: 0,
        scale: 0.82,
      });
      gsap.set(heroInner, {
        yPercent: 0,
        autoAlpha: 1,
      });
      gsap.set(heroScroll, {
        autoAlpha: 1,
        y: 0,
      });

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: config.scrub,
        },
      });

      timeline
        .to(heroScroll, { autoAlpha: 0, y: -16, duration: 0.16 }, 0)
        .to(heroBase, { yPercent: config.baseDriftY, scale: config.baseScale, duration: 1 }, 0)
        .to(heroSpotlight, { autoAlpha: config.spotlightPeak, scale: config.spotlightScale, duration: 0.34 }, 0.06)
        .to(heroPresenter, {
          xPercent: config.presenterLeadX,
          yPercent: config.presenterLiftY,
          scale: config.presenterLeadScale,
          rotation: config.presenterLeadRotate,
          duration: 0.42,
        }, 0.18)
        .to(heroMicPulse, { autoAlpha: 0.72, scale: 1.02, duration: 0.14 }, 0.24)
        .to(heroMicPulse, { autoAlpha: 0.22, scale: 1.45, duration: 0.2 }, 0.37)
        .to(heroMicPulse, { autoAlpha: 0.68, scale: 1.04, duration: 0.14 }, 0.56)
        .to(heroMicPulse, { autoAlpha: 0.18, scale: 1.52, duration: 0.24 }, 0.66)
        .to(heroInner, { yPercent: -config.textRiseY, autoAlpha: config.textFadeTo, duration: 0.26 }, 0.72)
        .to(heroPresenter, {
          xPercent: config.presenterExitX,
          yPercent: config.presenterExitY,
          scale: config.presenterExitScale,
          autoAlpha: config.presenterExitAlpha,
          duration: 0.2,
        }, 0.82)
        .to(heroSpotlight, { autoAlpha: config.spotlightExit, scale: 1.04, duration: 0.18 }, 0.84)
        .to(heroMicPulse, { autoAlpha: 0, duration: 0.1 }, 0.9);

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    };

    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () =>
      setupTimeline({
        scrub: 0.95,
        baseDriftY: -6,
        baseScale: 1.03,
        presenterLeadX: -8,
        presenterLiftY: -3.5,
        presenterLeadScale: 1.06,
        presenterLeadRotate: -1.6,
        presenterExitX: 5,
        presenterExitY: 2.4,
        presenterExitScale: 1.02,
        presenterExitAlpha: 0.48,
        spotlightStart: 0.18,
        spotlightPeak: 0.36,
        spotlightScale: 1.08,
        spotlightExit: 0.1,
        textRiseY: 8,
        textFadeTo: 0.78,
      })
    );

    mm.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', () =>
      setupTimeline({
        scrub: 0.85,
        baseDriftY: -4,
        baseScale: 1.02,
        presenterLeadX: -5,
        presenterLiftY: -2.4,
        presenterLeadScale: 1.05,
        presenterLeadRotate: -1.1,
        presenterExitX: 4,
        presenterExitY: 1.8,
        presenterExitScale: 1.01,
        presenterExitAlpha: 0.52,
        spotlightStart: 0.2,
        spotlightPeak: 0.34,
        spotlightScale: 1.05,
        spotlightExit: 0.12,
        textRiseY: 5,
        textFadeTo: 0.82,
      })
    );

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(heroBase, { clearProps: 'transform' });
      gsap.set(heroPresenter, { clearProps: 'transform,opacity' });
      gsap.set(heroSpotlight, { clearProps: 'transform,opacity' });
      gsap.set(heroInner, { clearProps: 'transform,opacity' });
      gsap.set(heroScroll, { clearProps: 'transform,opacity' });
      gsap.set(heroMicPulse, { autoAlpha: 0, clearProps: 'transform' });
    });

    return () => {
      mm.revert();
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing">
      <div className="bg-noise" />

      {/* ═══ NAV ═══ */}
      <nav className="nav" ref={navRef}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-dot" />
            Pitchr
          </Link>
          <div className="nav-links">
            <a href="#delivery" className="nav-link" onClick={(e) => scrollToSection(e, 'delivery')}>
              Delivery
            </a>
            <a href="#rubric" className="nav-link" onClick={(e) => scrollToSection(e, 'rubric')}>
              Rubric
            </a>
            <a href="#growth" className="nav-link" onClick={(e) => scrollToSection(e, 'growth')}>
              Growth
            </a>
            <a href="#pricing" className="nav-link" onClick={(e) => scrollToSection(e, 'pricing')}>
              Pricing
            </a>
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
            <a href="#waitlist" className="nav-cta" onClick={scrollToWaitlist}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero" ref={heroSectionRef}>
        <div className="hero-bg hero-bg-base" ref={heroBgBaseRef} />
        <HeroPresenterTiles isDark={isDark} ref={heroPresenterRef} />
        <div className="hero-spotlight" ref={heroSpotlightRef} />
        <div className="hero-mic-pulse" ref={heroMicPulseRef} />
        <div className="container hero-inner" ref={heroInnerRef}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Pitch Coaching
          </div>

          <h1>
            Ship pitches that<br />
            <span className="accent">close rounds.</span>
          </h1>

          <p className="hero-sub">
            Record or paste your pitch. Get an investor-grade score, ranked fixes, a rewritten
            script, and delivery metrics — in seconds.
          </p>

          <div className="hero-ctas">
            <a href="#waitlist" className="btn-primary" onClick={scrollToWaitlist}>
              Join the Waitlist
              <span className="btn-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </a>
            <a href="#delivery" className="btn-secondary" onClick={(e) => scrollToSection(e, 'delivery')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-scroll" ref={heroScrollRef}>
          <div className="hero-scroll-text">Scroll</div>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ═══ SECTION 1: DELIVERY WAVEFORM ═══ */}
      <section className="story-section" id="delivery">
        <div className="container story-grid">
          <div className="story-text reveal">
            <h2>
              Delivery <i>tuning</i> in real-time.
            </h2>
            <p>
              Investors tune out when you rely on filler words or speak at a frantic pace. Pitchr
              analyzes your live audio stream to detect pacing, hesitation, and vocabulary crutches
              instantly.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>
              {'> Analyzes WPM, Pauses, and Fillers'}
            </p>
          </div>
          <div className="story-visual reveal">
            <svg className="waveform-svg" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax meet">
              {[
                { x: 20, y: 25, h: 50, d: 0.1 }, { x: 40, y: 10, h: 80, d: 0.3 },
                { x: 60, y: 30, h: 40, d: 0.5 }, { x: 80, y: 15, h: 70, d: 0.2 },
                { x: 100, y: 35, h: 30, d: 0.6 }, { x: 120, y: 5, h: 90, d: 0.1 },
                { x: 140, y: 20, h: 60, d: 0.4 }, { x: 160, y: 40, h: 20, d: 0.7 },
                { x: 180, y: 10, h: 80, d: 0.3 }, { x: 200, y: 25, h: 50, d: 0.5 },
                { x: 220, y: 15, h: 70, d: 0.2 }, { x: 240, y: 5, h: 90, d: 0.8 },
                { x: 260, y: 30, h: 40, d: 0.1 }, { x: 280, y: 20, h: 60, d: 0.4 },
                { x: 300, y: 10, h: 80, d: 0.6 }, { x: 320, y: 35, h: 30, d: 0.3 },
                { x: 340, y: 15, h: 70, d: 0.5 }, { x: 360, y: 25, h: 50, d: 0.2 },
              ].map((bar) => (
                <rect
                  key={bar.x}
                  x={bar.x}
                  y={bar.y}
                  width="8"
                  height={bar.h}
                  rx="4"
                  className="wave-bar"
                  style={{ animationDelay: `${bar.d}s` }}
                />
              ))}
            </svg>
            <div className="live-transcript">
              &quot;We are{' '}
              <span className="strike">
                um, basically
                <span className="correction">building</span>
              </span>{' '}
              the next generation of databases...&quot;
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: RUBRIC RADAR ═══ */}
      <section className="story-section" id="rubric">
        <div className="container story-grid">
          <div className="story-visual reveal" id="radarReveal">
            <div className="radar-container">
              <svg viewBox="-10 -5 220 210" width="100%" height="100%">
                <g className="radar-bg">
                  <polygon points="100,20 176,75 147,165 53,165 24,75" />
                  <polygon points="100,40 157,81 135,148 65,148 43,81" />
                  <polygon points="100,60 138,88 124,131 76,131 62,88" />
                  <polygon points="100,80 119,94 112,115 88,115 81,94" />
                </g>
                <g className="radar-axis">
                  <line x1="100" y1="100" x2="100" y2="20" />
                  <line x1="100" y1="100" x2="176" y2="75" />
                  <line x1="100" y1="100" x2="147" y2="165" />
                  <line x1="100" y1="100" x2="53" y2="165" />
                  <line x1="100" y1="100" x2="24" y2="75" />
                </g>
                <path
                  className="radar-fill"
                  ref={radarPathRef}
                  d="M100,60 L138,88 L124,131 L53,165 L24,75 Z"
                />
                <text x="100" y="-2" textAnchor="middle" className="radar-label">Structure</text>
                <text x="200" y="75" textAnchor="start" className="radar-label">Clarity</text>
                <text x="168" y="192" textAnchor="start" className="radar-label">Evidence</text>
                <text x="32" y="192" textAnchor="end" className="radar-label">Market</text>
                <text x="0" y="75" textAnchor="end" className="radar-label">Delivery</text>
              </svg>
            </div>
          </div>
          <div className="story-text reveal">
            <h2>
              The Investor-Ready <i>Matrix</i>.
            </h2>
            <p>
              A great product doesn&apos;t mean a great pitch. Pitchr evaluates you across 5
              absolute dimensions that venture capitalists care about. Stop guessing where your
              blind spots are.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--green)' }}>
              {'> Score: 100/100 (Perfectly Balanced)'}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: GROWTH TRAJECTORY ═══ */}
      <section className="story-section" id="growth">
        <div className="container story-grid">
          <div className="story-text reveal">
            <h2>
              Your score, <i>climbing</i>.
            </h2>
            <p>
              Your first take won&apos;t be perfect. Pitchr gives you a prioritized list of ranked
              fixes. Apply the AI rewrites, practice your delivery, and watch your score hit the
              Investor-Ready threshold.
            </p>
            <p style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)' }}>
              {'> Delta: +45 points in 3 sessions'}
            </p>
          </div>
          <div className="story-visual reveal" id="chartReveal">
            <div className="chart-container">
              <div className="chart-zones">
                <div className="zone-label zone-green">Investor Ready (80+)</div>
                <div className="zone-label zone-red">Needs Work (&lt;60)</div>
              </div>
              <svg className="chart-svg" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff3d00" />
                    <stop offset="50%" stopColor="#ff9100" />
                    <stop offset="100%" stopColor="#00c853" />
                  </linearGradient>
                </defs>
                <g className="chart-grid">
                  <line x1="0" y1="40" x2="500" y2="40" />
                  <line x1="0" y1="100" x2="500" y2="100" />
                  <line x1="0" y1="160" x2="500" y2="160" />
                </g>
                <path className="chart-path" d="M 0,160 Q 150,160 250,100 T 500,40" />
                <circle className="chart-dot" cx="500" cy="40" r="6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="stats-bar">
        <div className="container stats-inner reveal">
          <div className="stat">
            <div className="stat-value">100</div>
            <div className="stat-label">Point Scale</div>
          </div>
          <div className="stat">
            <div className="stat-value">5</div>
            <div className="stat-label">Rubric Categories</div>
          </div>
          <div className="stat">
            <div className="stat-value">&lt;30s</div>
            <div className="stat-label">Analysis Time</div>
          </div>
          <div className="stat">
            <div className="stat-value">2</div>
            <div className="stat-label">Pitch Modes</div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="testimonial-section" style={{ padding: '100px 0' }}>
        <div className="container">
          <div className="testimonial-card reveal">
            <div className="testimonial-quote">
              I&apos;m used to building things — but pitching them was always the hard part. Pitchr
              is a product I can see myself coming back to every time I have a new idea to present.
            </div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">AE</div>
              <div>
                <div className="testimonial-name">Anthony Eid</div>
                <div className="testimonial-role">Software Engineer @ Zed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BLOG ═══ */}
      <LandingBlog />

      {/* ═══ PRICING ═══ */}
      <LandingPricing />

      {/* ═══ WAITLIST ═══ */}
      <section className="cta-section" id="waitlist" ref={ctaContainerRef}>
        <div className="cta-glow" ref={ctaGlowRef} />
        <div className="container cta-content reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Early Access</div>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Be the first to<br />
            <span className="accent">start scoring.</span>
          </h2>
          <p className="section-desc" style={{ textAlign: 'center', margin: '0 auto 32px' }}>
            Pitchr is launching soon. Join the waitlist to get early access to AI-powered
            pitch scoring, ranked fixes, and rewritten scripts.
          </p>

          {waitlistStatus === 'success' ? (
            <div className="waitlist-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{waitlistMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="waitlist-form">
              <div className="waitlist-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="waitlist-input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  className="waitlist-input"
                  disabled={waitlistStatus === 'loading'}
                />
                <button
                  type="submit"
                  className="btn-primary waitlist-btn"
                  disabled={waitlistStatus === 'loading'}
                >
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
                  <span className="btn-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
              {waitlistStatus === 'error' && (
                <p className="waitlist-error">{waitlistMessage}</p>
              )}
            </form>
          )}

        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="nav-logo-dot" style={{ width: '6px', height: '6px' }} />
            Pitchr — AI Pitch Coach
          </div>
          <div className="footer-links">
            <a href="#delivery" className="footer-link" onClick={(e) => scrollToSection(e, 'delivery')}>
              Delivery
            </a>
            <a href="#rubric" className="footer-link" onClick={(e) => scrollToSection(e, 'rubric')}>
              Rubric
            </a>
            <a href="#pricing" className="footer-link" onClick={(e) => scrollToSection(e, 'pricing')}>
              Pricing
            </a>
            <Link href="/blog" className="footer-link">
              Journal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
