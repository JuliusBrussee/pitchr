'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  animationDelay?: string;
  animate?: boolean;
}

const paddingMap = { sm: 'p-3', md: 'p-5', lg: 'p-6' };

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      className = '',
      padding = 'md',
      animationDelay,
      animate = true,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        {...rest}
        className={`rounded-2xl border ${paddingMap[padding]} ${animate ? 'animate-fade-in-up' : ''} ${className}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
          ...(animationDelay ? { animationDelay, animationFillMode: 'both' as const } : {}),
          ...rest.style,
        }}
      >
        {children}
      </div>
    );
  },
);
