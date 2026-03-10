'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const PRIVACY_NOTICE_VERSION = process.env.NEXT_PUBLIC_GDPR_POLICY_VERSION || '2026-03-04';

export function WaitlistSection() {
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaGlowRef = useRef<HTMLDivElement>(null);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPrivacyAck] = useState(true);
  const [waitlistNewsletterOptIn, setWaitlistNewsletterOptIn] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');

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
          privacy_notice_acknowledged: waitlistPrivacyAck,
          privacy_notice_version: PRIVACY_NOTICE_VERSION,
          newsletter_opt_in: waitlistNewsletterOptIn,
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
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              By joining, you agree to the <Link href="/privacy" className="underline">Privacy Notice</Link>.
            </p>
            <label className="waitlist-toggle-label mt-2">
              <span className="waitlist-toggle-text">Send me product updates</span>
              <button
                type="button"
                role="switch"
                aria-checked={waitlistNewsletterOptIn}
                className={`waitlist-toggle ${waitlistNewsletterOptIn ? 'waitlist-toggle--on' : ''}`}
                onClick={() => setWaitlistNewsletterOptIn(!waitlistNewsletterOptIn)}
              >
                <span className="waitlist-toggle-knob" />
              </button>
            </label>
            {waitlistStatus === 'error' && (
              <p className="waitlist-error">{waitlistMessage}</p>
            )}
          </form>
        )}

      </div>
    </section>
  );
}
