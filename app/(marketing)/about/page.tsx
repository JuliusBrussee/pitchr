import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PitchrLogoStatic } from '@/views/components/PitchrLogoStatic';
import { AboutScrollReveal } from '@/views/components/public/AboutScrollReveal';
import '@/app/(marketing)/public-pages.css';

export const metadata: Metadata = {
  title: 'About Pitchr',
  description:
    'Pitchr is an AI pitch coach for founders and hackathon teams. We build a fast feedback loop around your pitch: score, ranked fixes, rewrites, and delivery metrics so you practice under pressure instead of alone.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Pitchr',
    description:
      'Why we built an AI pitch coach for founder and hackathon pitch practice. Structured feedback on clarity, structure, pacing, and delivery so the next take lands better.',
    type: 'website',
  },
};

const PRINCIPLES = ['Practice beats theory.', 'Feedback should be ranked.', 'Delivery is part of the pitch.', 'Investor-grade feedback before the room.'];

const AUDIENCE = ['Founders raising a round', 'Hackathon and demo day teams', 'Students and first-time pitchers', 'Operators pitching internally'];

export default function AboutPage() {
  return (
    <main className="public-page">
      {/* Hero */}
      <section className="pp-hero">
        <div className="pp-hero-bg">
          <div className="pp-hero-spot pp-hero-spot-1" />
          <div className="pp-hero-spot pp-hero-spot-2" />
        </div>
        <div className="pp-hero-content">
          <p className="pp-eyebrow">About Pitchr</p>
          <h1 className="pp-hero-question">
            Why we built an AI pitch coach instead of rehearsing alone.
          </h1>
          <p className="pp-hero-answer">
            Pitchr gives founders and hackathon teams a fast loop on the pitch that matters next: score out of 100,
            ranked fixes, rewrites, and delivery metrics. Our mission is to cut communication risk before
            high-stakes moments so the next take lands better.
          </p>
        </div>
      </section>

      {/* Body: scroll-reveal adds .visible when sections enter viewport */}
      <AboutScrollReveal>
        {/* Why + Story (one block, landing-style) */}
        <section className="pp-section-card">
          <div className="pp-section-number">01</div>
          <h2 className="pp-section-title">Why we built Pitchr</h2>
          <p className="pp-section-body">
            Strong products lose when the pitch underperforms. We built a fast loop around the real words
            you plan to say (record or paste, get scored and rewritten) so you fix communication risk
            before it costs you.
          </p>
        </section>

        {/* How it works */}
        <section className="pp-section-card">
          <div className="pp-section-number">02</div>
          <h2 className="pp-section-title">How it works</h2>
          <p className="pp-section-body" style={{ marginBottom: 8 }}>
            Capture your pitch (record or paste). Get a score out of 100, fixes ordered by impact, and a
            tighter rewrite. Run it again before the next meeting.
          </p>
          <p className="pp-section-body" style={{ margin: 0, fontSize: 13, color: 'var(--pp-text-muted)' }}>
            <Link href="/scoring-logic">Scoring logic</Link> · <Link href="/delivery-rubric">Delivery rubric</Link>
          </p>
        </section>

        {/* Beliefs + Who (one grid, titles only) */}
        <section className="pp-sections">
          <div className="pp-section-card">
            <div className="pp-section-number">03</div>
            <h2 className="pp-section-title">What we believe</h2>
            <p className="pp-section-body" style={{ marginBottom: 12 }}>
              A few principles that shape how we built Pitchr:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRINCIPLES.map((line) => (
                <li key={line} style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="pp-section-card">
            <div className="pp-section-number">04</div>
            <h2 className="pp-section-title">Who it is for</h2>
            <p className="pp-section-body" style={{ marginBottom: 12 }}>
              We built this for people who need to nail a real pitch soon:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {AUDIENCE.map((line) => (
                <li key={line} style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>{line}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Founders */}
        <section className="pp-section-card">
          <div className="pp-section-number">05</div>
          <h2 className="pp-section-title">Founders</h2>
          <p className="pp-section-body" style={{ marginBottom: 12 }}>
            Small team building the product and the rubric.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>
              <a
                href="https://www.linkedin.com/in/julius-brussee-58896a273/?originalSubdomain=nl"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--pp-text)', fontWeight: 600, textDecoration: 'none' }}
                className="pp-founder-link"
              >
                Julius Brussee
              </a>
              {' · '}AI engineer building practical ML products.
            </li>
            <li style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>
              <a
                href="https://www.linkedin.com/in/lucas-duys/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--pp-text)', fontWeight: 600, textDecoration: 'none' }}
                className="pp-founder-link"
              >
                Lucas Duys
              </a>
              {' · '}Software engineer focused on clean, usable products.
            </li>
            <li style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>
              <a
                href="https://www.linkedin.com/in/aravmadan/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--pp-text)', fontWeight: 600, textDecoration: 'none' }}
                className="pp-founder-link"
              >
                Arav Madan
              </a>
              {' · '}Product builder focused on structured AI systems.
            </li>
            <li style={{ fontSize: 14, color: 'var(--pp-text-secondary)' }}>
              <a
                href="https://www.linkedin.com/in/martino-micheletti/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--pp-text)', fontWeight: 600, textDecoration: 'none' }}
                className="pp-founder-link"
              >
                Martino Micheletti
              </a>
              {' · '}Electronics engineer building at the intersection of hardware and AI.
            </li>
          </ul>
        </section>

        {/* Related */}
        <section className="pp-related visible">
          <div className="pp-related-header">
            <p className="pp-related-eyebrow">Learn more</p>
            <h2 className="pp-related-title">Deep dives</h2>
          </div>
          <div className="pp-related-grid">
            <Link href="/scoring-logic" className="pp-related-link">
              <div>
                <p className="pp-related-link-label">Scoring Logic</p>
                <p className="pp-related-link-desc">How the 100-point score breaks down across structure, clarity, evidence, market, and delivery.</p>
              </div>
              <span className="pp-related-link-arrow">→</span>
            </Link>
            <Link href="/delivery-rubric" className="pp-related-link">
              <div>
                <p className="pp-related-link-label">Delivery Rubric</p>
                <p className="pp-related-link-desc">Pacing, filler words, and pauses we track when you record, and how they affect your score.</p>
              </div>
              <span className="pp-related-link-arrow">→</span>
            </Link>
            <Link href="/growth-pricing" className="pp-related-link">
              <div>
                <p className="pp-related-link-label">Growth Pricing</p>
                <p className="pp-related-link-desc">Plans and credits built around how often founders actually practice.</p>
              </div>
              <span className="pp-related-link-arrow">→</span>
            </Link>
            <Link href="/blog" className="pp-related-link">
              <div>
                <p className="pp-related-link-label">Journal</p>
                <p className="pp-related-link-desc">Notes on building Pitchr, tuning the rubric, and what we’re learning from real runs.</p>
              </div>
              <span className="pp-related-link-arrow">→</span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="pp-cta-banner">
          <h2 className="pp-cta-banner-title">Run your pitch through Pitchr.</h2>
          <p className="pp-cta-banner-desc">
            Record or paste the pitch you plan to use next. Get a score out of 100, ranked fixes, a tighter rewrite,
            and delivery metrics you can improve before the next meeting.
          </p>
          <Link href="/try" className="pp-cta-button">
            Try Pitchr
            <ArrowRight size={16} />
          </Link>
        </section>
      </AboutScrollReveal>

      {/* Footer: same structure as landing for consistency */}
      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <div className="pp-footer-left">
            <PitchrLogoStatic size={16} />
            Pitchr | AI Pitch Coach
          </div>
          <div className="pp-footer-links">
            <Link href="/solutions/elevator-pitch" className="pp-footer-link">
              Solutions
            </Link>
            <Link href="/about" className="pp-footer-link">
              About
            </Link>
            <Link href="/delivery-rubric" className="pp-footer-link">
              Delivery Rubric
            </Link>
            <Link href="/scoring-logic" className="pp-footer-link">
              Scoring Logic
            </Link>
            <Link href="/growth-pricing" className="pp-footer-link">
              Growth Pricing
            </Link>
            <Link href="/blog" className="pp-footer-link">
              Journal
            </Link>
            <Link href="/terms" className="pp-footer-link">
              Terms
            </Link>
            <Link href="/privacy" className="pp-footer-link">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
