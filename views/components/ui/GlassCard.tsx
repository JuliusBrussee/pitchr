'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  animationDelay?: string;
  animate?: boolean;
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function GlassCard({
  children,
  className = '',
  padding = 'md',
  animationDelay,
  animate = true,
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border ${paddingMap[padding]} ${animate ? 'animate-fade-in-up' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        ...(animationDelay ? { animationDelay, animationFillMode: 'both' as const } : {}),
      }}
    >
      {children}
    </div>
  );
}
