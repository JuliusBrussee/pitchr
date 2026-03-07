'use client';

import type { ComponentType, CSSProperties, ReactNode } from 'react';

export function SectionCard({
  icon: Icon,
  title,
  delay,
  id: sectionId,
  children,
  iconColor,
  titleColor,
  borderColor,
  compact,
}: {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  title: string;
  delay: number;
  id?: string;
  children: ReactNode;
  iconColor?: string;
  titleColor?: string;
  borderColor?: string;
  compact?: boolean;
}) {
  return (
    <div
      id={sectionId}
      className={`rounded-2xl border animate-fade-in-up ${compact ? 'p-4' : 'p-6'}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: borderColor ?? 'var(--border-color)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className={`flex items-center gap-3 ${compact ? 'mb-3' : 'mb-5'}`}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: iconColor ? `${iconColor}1a` : 'var(--bg-surface-hover)' }}
        >
          <Icon size={16} style={iconColor ? { color: iconColor } : undefined} />
        </div>
        <h2
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: titleColor ?? 'var(--text-primary)' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
