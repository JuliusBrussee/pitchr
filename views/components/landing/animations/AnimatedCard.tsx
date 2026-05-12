'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface AnimatedCardProps {
  href: string;
  label: string;
  tagline: string;
  children: ReactNode;
  className?: string;
}

export function AnimatedCard({ href, label, tagline, children, className = '' }: AnimatedCardProps) {
  return (
    <Link href={href} className={`anim-card stagger-child ${className}`}>
      <div className="anim-card-header">
        <div>
          <span className="anim-card-label">{label}</span>
          <h3 className="anim-card-tagline">{tagline}</h3>
        </div>
        <span className="anim-card-arrow">&rarr;</span>
      </div>
      <div className="anim-card-demo">
        {children}
      </div>
    </Link>
  );
}
