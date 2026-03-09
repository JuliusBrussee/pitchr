'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react';

const STATS = [
  { icon: TrendingUp, value: '72/100', label: 'Pitch Score' },
  { icon: Zap, value: '4 fixes', label: 'Ranked by Impact' },
  { icon: Sparkles, value: '< 60s', label: 'AI Analysis' },
];

export function DemoCTA() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`demo-cta-overlay${entered ? ' demo-cta-overlay--entered' : ''}`}>
      {/* Background effects */}
      <div className="demo-cta__bg-grain" />
      <div className="demo-cta__bg-glow demo-cta__bg-glow--1" />
      <div className="demo-cta__bg-glow demo-cta__bg-glow--2" />
      <div className="demo-cta__bg-glow demo-cta__bg-glow--3" />

      {/* Floating orbs */}
      <div className="demo-cta__orb demo-cta__orb--1" />
      <div className="demo-cta__orb demo-cta__orb--2" />
      <div className="demo-cta__orb demo-cta__orb--3" />

      {/* Content */}
      <div className="demo-cta__content">
        {/* Badge */}
        <div className="demo-cta__badge">
          <Sparkles size={12} />
          <span>AI-Powered Pitch Coach</span>
        </div>

        {/* Title */}
        <h2 className="demo-cta__title">
          Ready to nail your
          <br />
          <span className="demo-cta__title-accent">next pitch?</span>
        </h2>

        {/* Subtitle */}
        <p className="demo-cta__subtitle">
          Get investor-grade feedback in under 60 seconds.
          <br />
          Score, fix, and rewrite — powered by AI.
        </p>

        {/* Stats row */}
        <div className="demo-cta__stats">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="demo-cta__stat"
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              <stat.icon size={14} className="demo-cta__stat-icon" />
              <span className="demo-cta__stat-value">{stat.value}</span>
              <span className="demo-cta__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="demo-cta__buttons">
          <Link href="https://pitchr.live/login" className="demo-cta__btn demo-cta__btn--primary">
            <span>Try Pitchr Free</span>
            <ArrowRight size={16} />
            <div className="demo-cta__btn-shimmer" />
          </Link>
          <Link href="https://pitchr.live" className="demo-cta__btn demo-cta__btn--secondary">
            Learn More
          </Link>
        </div>

        {/* Microcopy */}
        <p className="demo-cta__micro">No credit card required</p>
      </div>
    </div>
  );
}
