'use client';

import { Fragment, useEffect, useState } from 'react';

const LAUNCH_MS = new Date('2026-03-13T09:00:00').getTime();

function remaining() {
  const d = Math.max(0, LAUNCH_MS - Date.now());
  return {
    days: Math.floor(d / 86_400_000),
    hours: Math.floor((d % 86_400_000) / 3_600_000),
    min: Math.floor((d % 3_600_000) / 60_000),
    sec: Math.floor((d % 60_000) / 1000),
    done: d === 0,
  };
}

const p2 = (n: number) => String(n).padStart(2, '0');

const LABELS = ['Days', 'Hours', 'Min', 'Sec'] as const;

export function LaunchCountdown({
  onCtaClick,
}: {
  onCtaClick: (e: React.MouseEvent) => void;
}) {
  const [t, setT] = useState(remaining);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const id = setInterval(() => setT(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!ready) return null;

  const digits = [p2(t.days), p2(t.hours), p2(t.min), p2(t.sec)];

  return (
    <section className={`cd-section${t.done ? ' cd-live' : ''}`}>
      <div className="cd-aura" />
      <div className="container cd-inner">
        {/* Overline with ruled accent lines */}
        <div className="cd-overline">
          <span className="cd-rule" />
          <span className="cd-tag">
            {t.done ? 'WE ARE LIVE' : 'LAUNCH SEQUENCE'}
          </span>
          <span className="cd-rule" />
        </div>

        {/* The clock */}
        <div className="cd-clock" role="timer" aria-label="Countdown to launch">
          {digits.map((pair, i) => (
            <Fragment key={LABELS[i]}>
              {i > 0 && (
                <span className="cd-colon" aria-hidden="true">
                  :
                </span>
              )}
              <div className="cd-unit">
                <div className="cd-card">
                  <span className="cd-d">{pair[0]}</span>
                  <span className="cd-d">{pair[1]}</span>
                </div>
                <span className="cd-lbl">{LABELS[i]}</span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* Date */}
        <p className="cd-date">
          Friday, March 13 &middot; 9 : 00 AM
        </p>

        {/* CTA */}
        <a href="#waitlist" className="cd-cta" onClick={onCtaClick}>
          {t.done ? 'Start Scoring Now' : 'Join the Waitlist'}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
        <p className="cd-sub">
          {t.done ? 'Early access is live — limited spots available.' : 'Free to join · Early access perks for waitlist members'}
        </p>
      </div>
    </section>
  );
}
