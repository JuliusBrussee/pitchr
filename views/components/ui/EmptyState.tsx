'use client';

import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message?: string;
  illustration?: React.ReactNode;
  title?: string;
  description?: string;
  cta?: { label: string; href?: string; onClick?: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void };
  variant?: 'default' | 'error' | 'filtered';
  showGlow?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  illustration,
  title,
  description,
  cta,
  secondaryAction,
  variant = 'default',
  showGlow,
  className = '',
}: EmptyStateProps) {
  const isLegacy = !illustration && !title && !description && !cta;
  const isFiltered = variant === 'filtered';
  const isError = variant === 'error';

  const glowColor = isError
    ? 'rgba(239, 68, 68, 0.06)'
    : 'rgba(255, 89, 65, 0.06)';

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center overflow-hidden ${className}`}
      style={{ padding: isLegacy ? '48px 20px' : '48px 24px' }}
    >
      {/* Background glow */}
      {showGlow && !isFiltered && (
        <div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Illustration or icon */}
      {illustration ? (
        <div className="relative mb-4 empty-stagger-in" style={{ animationDelay: '0s' }}>
          {illustration}
        </div>
      ) : icon ? (
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 empty-stagger-in"
          style={{
            background: isError
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))'
              : 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.06))',
            boxShadow: isFiltered ? 'none' : `0 0 40px ${glowColor}`,
            animationDelay: '0s',
          }}
        >
          {icon}
        </div>
      ) : !illustration && (
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 empty-stagger-in"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.06))',
            animationDelay: '0s',
          }}
        >
          <Search size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}

      {/* Title */}
      {title && (
        <p
          className="relative text-sm font-semibold mb-1 empty-stagger-in"
          style={{ color: 'var(--text-primary)', animationDelay: '0.1s' }}
        >
          {title}
        </p>
      )}

      {/* Description or legacy message */}
      {(description || message) && (
        <p
          className="relative text-xs max-w-[280px] empty-stagger-in"
          style={{
            color: 'var(--text-muted)',
            animationDelay: title ? '0.15s' : '0.1s',
          }}
        >
          {description || message}
        </p>
      )}

      {/* CTA button */}
      {cta && (
        <div className="relative mt-5 empty-stagger-in" style={{ animationDelay: '0.2s' }}>
          {cta.href ? (
            <Link href={cta.href} className="no-underline">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(255, 89, 65, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                {cta.icon}
                {cta.label}
              </button>
            </Link>
          ) : (
            <button
              onClick={cta.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(255, 89, 65, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {cta.icon}
              {cta.label}
            </button>
          )}
        </div>
      )}

      {/* Secondary action */}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="relative mt-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors empty-stagger-in"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface-hover)',
            animationDelay: '0.25s',
          }}
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
