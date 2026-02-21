'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';

interface InsightCardProps {
  type: 'strength' | 'improve';
  title: string;
  body: string;
  delay: number;
}

export function InsightCard({ type, title, body, delay }: InsightCardProps) {
  const isStrength = type === 'strength';
  const borderColor = isStrength ? '#22c55e' : '#f59e0b';
  const iconColor = isStrength ? '#22c55e' : '#f59e0b';
  const Icon = isStrength ? CheckCircle : AlertTriangle;

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-200 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
        animationDelay: `${480 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex-shrink-0 mt-0.5" style={{ color: iconColor }}>
          <Icon size={15} />
        </span>
        <div>
          <p
            className="text-xs font-semibold mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
