import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { HomeJsonLd } from '@/views/components/seo/HomeJsonLd';
import { PitchrLogoStatic } from '@/views/components/PitchrLogoStatic';
import { ThemeToggleButton } from '@/views/components/landing/ThemeToggleButton';
import { WaitlistSection } from '@/views/components/landing/WaitlistSection';
import { LandingEffects } from '@/views/components/landing/LandingEffects';
import { HeroPresenterIsland } from '@/views/components/landing/HeroPresenterIsland';
import { LaunchCountdown } from '@/views/components/landing/LaunchCountdown';
import { LandingDemo } from '@/views/components/landing/LandingDemo';
import { LandingBlog } from '@/views/components/landing/LandingBlog';
import { LandingPricing } from '@/views/components/landing/LandingPricing';
import { DELIVERY_WAVE_BARS } from '@/views/components/landing/heroDeliveryFunnel.config';

import { SolutionsDropdown } from '@/views/components/landing/SolutionsDropdown';
import type { CSSProperties } from 'react';
import '@/app/(marketing)/landing.css';
import '@/app/(marketing)/solutions.css';
import '@/app/(marketing)/features/chapters.css';

export const revalidate = 3600;

export default function LandingPage() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <>
      <HomeJsonLd />

      {/* Thin client component — attaches scroll/observer/animation behaviors */}
      <LandingEffects />

      <div className="landing">
        <div className="bg-noise" />

        {/* ═══ NAV ═══ server-rendered for instant FCP */}
        <nav className="nav">
          <div className="container nav-inner">
            <Link href="/" className="nav-logo">
              <PitchrLogoStatic size={18} />
              Pitchr
            </Link>
            <div className="nav-links">
              <SolutionsDropdown />
              <a href="#pricing" className="nav-link">
                Plans
              </a>
              <Link href="/about" className="nav-link">
                About
              </Link>
              <Link href="/blog" className="nav-link">
                Journal
              </Link>
              <ThemeToggleButton />
              <a href="#waitlist" className="nav-cta">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Join Waitlist
              </a>
            </div>
          </div>
        </nav>

        {/* ═══ HERO ═══ static text renders immediately; tiles hydrate as client island */}
        <section className="hero">
          <div className="hero-bg hero-bg-base" />
          <HeroPresenterIsland />
          <div className="hero-spotlight" />
          <div className="hero-mic-pulse" />
          <div className="container hero-inner">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              AI-Powered Pitch Coaching
            </div>

            <h1>
              <span className="sr-only">Pitchr — </span>
              Ship pitches that<br />
              <span className="accent">close rounds.</span>
            </h1>

            <p className="hero-sub">
              Record or paste your pitch. Get an investor-grade score, ranked fixes, a rewritten
              script, and delivery metrics — in seconds.
            </p>

            <div className="hero-ctas">
              <a href="#waitlist" className="btn-primary">
                Join the Waitlist
                <span className="btn-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </a>
              <a href="#demo" className="btn-secondary">
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

        {/* ═══ LAUNCH COUNTDOWN ═══ */}
        <LaunchCountdown initialNowMs={Date.now()} />

        {/* ═══ PRODUCT DEMO ═══ */}
        <LandingDemo />

        {/* ═══ SECTION 1: DELIVERY WAVEFORM ═══ */}
        <section className="story-section story-section-delivery" id="delivery">
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
              <p className="story-mono-hint" style={{ fontSize: '14px', color: 'var(--accent)' }}>
                {'> Analyzes WPM, Pauses, and Fillers'}
              </p>
              <Link href="/delivery-rubric" className="story-link">
                See the delivery rubric
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="story-visual reveal">
              <svg
                className="waveform-svg"
                viewBox="0 0 400 100"
                preserveAspectRatio="xMidYMax meet"
              >
                {DELIVERY_WAVE_BARS.map((bar) => (
                  <rect
                    key={bar.x}
                    data-wave-bar=""
                    x={bar.x}
                    y={bar.y}
                    width="8"
                    height={bar.h}
                    rx="4"
                    className="wave-bar"
                    style={{
                      animationDelay: `${bar.d}s`,
                      '--bar-scale-limit': `${Math.max(0.48, ((bar.y + bar.h) - 2) / bar.h)}`,
                      '--bar-gain': `${0.76 + ((((bar.x / 20) % 5) * 0.04) + ((bar.h / 100) * 0.08))}`,
                      '--bar-tempo': `${0.88 + (((bar.x / 20) % 4) * 0.04)}`,
                    } as CSSProperties}
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
              <p className="story-mono-hint" style={{ fontSize: '14px', color: 'var(--green)' }}>
                {'> Score: 100/100 (Perfectly Balanced)'}
              </p>
              <Link href="/scoring-logic" className="story-link">
                See the scoring logic
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
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
              <p className="story-mono-hint" style={{ fontSize: '14px', color: 'var(--blue)' }}>
                {'> Delta: +45 points in 3 sessions'}
              </p>
              <Link href="/growth-pricing" className="story-link">
                See growth pricing
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
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
        <section className="testimonial-section">
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
        <LandingBlog posts={posts} />

        {/* ═══ PRICING ═══ */}
        <LandingPricing />

        {/* ═══ WAITLIST ═══ */}
        <WaitlistSection />

        {/* ═══ FOOTER ═══ */}
        <footer className="footer">
          <div className="container footer-inner">
            <div className="footer-left">
              <PitchrLogoStatic size={16} />
              Pitchr — AI Pitch Coach
            </div>
            <div className="footer-links">
              <Link href="/solutions/elevator-pitch" className="footer-link">
                Solutions
              </Link>
              <Link href="/about" className="footer-link">
                About
              </Link>
              <Link href="/delivery-rubric" className="footer-link">
                Delivery Rubric
              </Link>
              <Link href="/scoring-logic" className="footer-link">
                Scoring Logic
              </Link>
              <Link href="/growth-pricing" className="footer-link">
                Growth Pricing
              </Link>
              <Link href="/blog" className="footer-link">
                Journal
              </Link>
              <Link href="/terms" className="footer-link">
                Terms
              </Link>
              <Link href="/privacy" className="footer-link">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
