'use client';

import React from 'react';

interface SectionHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, icon, className = '' }: SectionHeaderProps) {
  return (
    <h2
      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {icon}
      {children}
    </h2>
  );
}
