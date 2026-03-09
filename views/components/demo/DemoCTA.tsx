'use client';

import Link from 'next/link';

export function DemoCTA() {
  return (
    <div className="demo-cta-overlay">
      <h2 className="demo-cta__title">Ready to improve your pitch?</h2>
      <p className="demo-cta__subtitle">
        Get investor-grade feedback in minutes, not weeks. Score, fix, and rewrite — powered by AI.
      </p>
      <div className="demo-cta__buttons">
        <Link href="/login" className="demo-cta__btn demo-cta__btn--primary">
          Try Pitchr Free
        </Link>
        <Link href="/" className="demo-cta__btn demo-cta__btn--secondary">
          Learn More
        </Link>
      </div>
    </div>
  );
}
