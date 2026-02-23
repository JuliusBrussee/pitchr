'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const radarPathRef = useRef<SVGPathElement>(null);
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);

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
            <Link href="/dashboard" className="nav-cta">
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

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner">
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
            <Link href="/dashboard" className="btn-primary">
              Get Started
              <span className="btn-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
            <a href="#delivery" className="btn-secondary" onClick={(e) => scrollToSection(e, 'delivery')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-scroll">
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

      {/* ═══ CTA ═══ */}
      <section className="cta-section" ref={ctaContainerRef}>
        <div className="cta-glow" ref={ctaGlowRef} />
        <div className="container cta-content reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Ready?</div>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Stop guessing.<br />
            <span className="accent">Start scoring.</span>
          </h2>
          <p className="section-desc" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
            Your next pitch meeting doesn&apos;t have to be a coin flip. Get AI-powered scoring,
            fixes, and a rewritten script — free and open source.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn-primary">
              Get Started
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
            <a
              href="https://github.com/JuliusBrussee/pitchr"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <div className="nav-logo-dot" style={{ width: '6px', height: '6px' }} />
            Pitchr — Open Source AI Pitch Coach
          </div>
          <div className="footer-links">
            <a
              href="https://github.com/JuliusBrussee/pitchr"
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a href="#delivery" className="footer-link" onClick={(e) => scrollToSection(e, 'delivery')}>
              Delivery
            </a>
            <a href="#rubric" className="footer-link" onClick={(e) => scrollToSection(e, 'rubric')}>
              Rubric
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
