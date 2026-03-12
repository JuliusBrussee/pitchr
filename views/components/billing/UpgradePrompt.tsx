'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Crown,
  Zap,
  ArrowRight,
  Check,
  AlertTriangle,
  Lock,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { BillingPlanId, BillingInterval } from '@/types/billing';

/* ——————————————————————————————————————————————————————————
 * UpgradePrompt — Premium upgrade modal with context-aware copy.
 *
 * Trigger contexts:
 *   limit_reached  — user hit their plan limit (0 credits, max runs)
 *   low_credits    — running low (1 credit left, 80%+ usage)
 *   feature_locked — tapped a Pro-only feature
 *   milestone      — after Nth free analysis (nudge, not blocking)
 * —————————————————————————————————————————————————————————— */

export type UpgradeContext =
  | 'limit_reached'
  | 'low_credits'
  | 'feature_locked'
  | 'milestone';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  context: UpgradeContext;
  /** Which feature was locked (for feature_locked context) */
  featureName?: string;
  /** Current plan for comparison */
  currentPlan?: BillingPlanId;
  /** Handler to start checkout */
  onUpgrade: (planId: BillingPlanId, interval: BillingInterval) => void;
  /** Handler to buy credits instead */
  onBuyCredits?: () => void;
  isLoading?: boolean;
}

const CONTEXT_CONFIG: Record<
  UpgradeContext,
  {
    icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; fill?: string }>;
    iconColor: string;
    iconBg: string;
    headline: string;
    subheadline: string;
    ctaLabel: string;
  }
> = {
  limit_reached: {
    icon: AlertTriangle,
    iconColor: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.1)',
    headline: "You've hit your limit",
    subheadline: 'Upgrade to Pro for 50 analyses/month, unlimited Q&A, and priority processing.',
    ctaLabel: 'Unlock Pro',
  },
  low_credits: {
    icon: TrendingUp,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.1)',
    headline: 'Running low on credits',
    subheadline: "You're almost out. Pro gives you 60 credits/month — that's 20x more room to practice.",
    ctaLabel: 'Get More Credits',
  },
  feature_locked: {
    icon: Lock,
    iconColor: '#ff5941',
    iconBg: 'rgba(255, 89, 65, 0.1)',
    headline: 'This feature requires Pro',
    subheadline: 'Upgrade to unlock advanced analytics, deck generation, and more.',
    ctaLabel: 'Unlock Feature',
  },
  milestone: {
    icon: Sparkles,
    iconColor: '#ffaa33',
    iconBg: 'rgba(255, 170, 51, 0.1)',
    headline: "You're on a roll",
    subheadline: 'Serious founders upgrade to Pro for deeper feedback and unlimited practice.',
    ctaLabel: 'Go Pro',
  },
};

const PRO_FEATURES = [
  '50 pitch analyses per month',
  '60 credits/month (20x free)',
  'Section-level feedback',
  'Vocabulary analytics',
  'AI deck generation',
  'Priority queue processing',
  'Historical comparison',
  'League access & streak freezes',
];

const FREE_VS_PRO: { label: string; free: string; pro: string }[] = [
  { label: 'Analyses', free: '3/mo', pro: '50/mo' },
  { label: 'Credits', free: '3/mo', pro: '60/mo' },
  { label: 'Q&A Time', free: '2 min', pro: '60 min' },
  { label: 'Deck Gen', free: 'No', pro: 'Yes' },
  { label: 'Section Feedback', free: 'No', pro: 'Yes' },
  { label: 'Queue Priority', free: 'Standard', pro: 'Priority' },
];

export function UpgradePrompt({
  isOpen,
  onClose,
  context,
  featureName,
  onUpgrade,
  onBuyCredits,
  isLoading,
}: UpgradePromptProps) {
  const [interval, setInterval] = useState<BillingInterval>('year');
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const config = CONTEXT_CONFIG[context];
  const Icon = config.icon;

  // Dynamic subheadline for feature_locked
  const subheadline = context === 'feature_locked' && featureName
    ? `Upgrade to Pro to unlock ${featureName} and all advanced features.`
    : config.subheadline;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose();
  };

  if (!isOpen) return null;

  const monthlyPrice = 29;
  const yearlyPrice = 290;
  const displayPrice = interval === 'year' ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const savings = interval === 'year' ? monthlyPrice * 12 - yearlyPrice : 0;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 80px rgba(255, 89, 65, 0.08)',
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          opacity: isClosing ? 0 : 1,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
          animation: isClosing ? 'none' : 'upgradeModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, #ff5941, #ffaa33, #ff5941)',
            backgroundSize: '200% 100%',
            animation: 'upgradeShimmer 3s linear infinite',
          }}
        />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 z-10"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-6 pb-2">
          {/* Context icon + headline */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
              style={{ backgroundColor: config.iconBg }}
            >
              <Icon size={22} style={{ color: config.iconColor }} />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {config.headline}
              </h2>
              <p
                className="text-sm mt-1 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {subheadline}
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div
            className="rounded-xl overflow-hidden mb-5"
            style={{ border: '1px solid var(--border-color)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-3 px-4 py-2.5"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Feature
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
                Free
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: '#ff5941' }}>
                Pro
              </span>
            </div>

            {/* Table rows */}
            {FREE_VS_PRO.map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-3 px-4 py-2.5 items-center"
                style={{
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)',
                  borderBottom: i < FREE_VS_PRO.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {row.label}
                </span>
                <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  {row.free}
                </span>
                <span className="text-xs font-semibold text-center" style={{ color: '#ff5941' }}>
                  {row.pro}
                </span>
              </div>
            ))}
          </div>

          {/* Interval toggle */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <div
              className="inline-flex items-center rounded-full p-0.5 gap-0.5"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setInterval('month')}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
                style={{
                  backgroundColor: interval === 'month' ? 'var(--bg-primary)' : 'transparent',
                  color: interval === 'month' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: interval === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5"
                style={{
                  backgroundColor: interval === 'year' ? 'var(--bg-primary)' : 'transparent',
                  color: interval === 'year' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: interval === 'year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Yearly
                {savings > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}
                  >
                    Save €{savings}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Price display */}
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                €{displayPrice}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                /mo
              </span>
            </div>
            {interval === 'year' && (
              <p className="text-[11px] mt-1" style={{ color: '#22c55e' }}>
                Billed €{yearlyPrice}/year
              </p>
            )}
          </div>
        </div>

        {/* CTA section */}
        <div
          className="px-6 pb-6 pt-2 flex flex-col gap-3"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(255, 89, 65, 0.02))',
          }}
        >
          {/* Primary CTA */}
          <button
            onClick={() => onUpgrade('pro', interval)}
            disabled={isLoading}
            className="group w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ff5941, #e63b26)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(255, 89, 65, 0.35), 0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Crown size={15} />
            {isLoading ? 'Loading...' : config.ctaLabel}
            {!isLoading && (
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            )}
          </button>

          {/* Secondary: Buy credits (for limit/low credit contexts) */}
          {onBuyCredits && (context === 'limit_reached' || context === 'low_credits') && (
            <button
              onClick={() => {
                onBuyCredits();
                handleClose();
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              Or buy a credit pack instead
            </button>
          )}

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Check size={10} strokeWidth={3} />
              Cancel anytime
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Check size={10} strokeWidth={3} />
              Secure checkout
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Check size={10} strokeWidth={3} />
              Powered by Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
