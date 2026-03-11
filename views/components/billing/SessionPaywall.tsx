'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Crown,
  Coins,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { CreditInfo } from '@/hooks/useBilling';
import type { BillingPlanId, BillingInterval } from '@/types/billing';
import { CREDIT_PACKS_STATIC } from '@/config/billing';

interface SessionPaywallProps {
  credits: CreditInfo;
  subscription: { planId: BillingPlanId } | null;
  onUpgrade: (planId: BillingPlanId, interval: BillingInterval) => void;
  onBuyCreditPack: (packSlug: string) => void;
}

const PRO_BENEFITS = [
  '60 credits/month',
  '50 analyses/month',
  'Deck generation',
  'Priority support',
];

const RECOMMENDED_PACKS = CREDIT_PACKS_STATIC.filter(
  (p) => p.slug === 'starter' || p.slug === 'sprint',
);

export function SessionPaywall({
  onUpgrade,
  onBuyCreditPack,
}: SessionPaywallProps) {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('year');

  const monthlyPrice = 29;
  const yearlyPrice = 290;
  const displayPrice = interval === 'year' ? Math.round(yearlyPrice / 12) : monthlyPrice;

  return (
    <main
      className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(255, 89, 65, 0.06) 0%, transparent 70%)',
      }}
    >
      {/* Dot texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border-color) 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
          opacity: 0.3,
        }}
      />

      <div
        className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center gap-8"
        style={{ animation: 'paywallFadeIn 0.5s ease-out' }}
      >
        {/* Lock icon + headline */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ff5941, #e63b26)',
              boxShadow: '0 8px 32px rgba(255, 89, 65, 0.3)',
            }}
          >
            <Lock size={28} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              You&apos;re out of credits
            </h1>
            <p
              className="text-sm mt-2 max-w-md"
              style={{ color: 'var(--text-secondary)' }}
            >
              Top up or upgrade to get back in the studio.
            </p>
          </div>

          {/* 0 credits pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}
          >
            <Coins size={12} />
            0 credits remaining
          </div>
        </div>

        {/* Action cards */}
        <div className="w-full flex flex-col lg:flex-row gap-4">
          {/* Card A: Upgrade to Pro */}
          <div
            className="flex-1 rounded-xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1.5px solid rgba(255, 89, 65, 0.3)',
              boxShadow: '0 0 24px rgba(255, 89, 65, 0.06)',
              animation: 'paywallSlideUp 0.5s ease-out 0.1s both',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 89, 65, 0.1)' }}
              >
                <Crown size={18} style={{ color: '#ff5941' }} />
              </div>
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Upgrade to Pro
              </h2>
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-2">
              {PRO_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <Check size={14} strokeWidth={3} style={{ color: '#22c55e' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {/* Interval toggle */}
            <div className="flex items-center justify-center">
              <div
                className="inline-flex items-center rounded-full p-0.5 gap-0.5"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <button
                  onClick={() => setInterval('month')}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
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
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    backgroundColor: interval === 'year' ? 'var(--bg-primary)' : 'transparent',
                    color: interval === 'year' ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: interval === 'year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Yearly
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}
                  >
                    Save $58
                  </span>
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ${displayPrice}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  /mo
                </span>
              </div>
              {interval === 'year' && (
                <p className="text-[11px] mt-0.5" style={{ color: '#22c55e' }}>
                  Billed ${yearlyPrice}/year
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() => onUpgrade('pro', interval)}
              className="group w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ff5941, #e63b26)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(255, 89, 65, 0.35), 0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Crown size={15} />
              Upgrade to Pro
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Check size={10} strokeWidth={3} />
                Cancel anytime
              </span>
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Check size={10} strokeWidth={3} />
                Secure checkout
              </span>
            </div>
          </div>

          {/* Card B: Buy Credits */}
          <div
            className="flex-1 rounded-xl p-6 flex flex-col gap-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              animation: 'paywallSlideUp 0.5s ease-out 0.2s both',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 170, 51, 0.1)' }}
              >
                <Coins size={18} style={{ color: '#ffaa33' }} />
              </div>
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Buy Credits
              </h2>
            </div>

            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Get credits instantly. No subscription needed.
            </p>

            {/* Recommended packs */}
            <div className="flex flex-col gap-3 flex-1">
              {RECOMMENDED_PACKS.map((pack) => (
                <div
                  key={pack.slug}
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full"
                      style={{ backgroundColor: 'rgba(255, 89, 65, 0.1)' }}
                    >
                      <Coins size={14} style={{ color: '#ff5941' }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {pack.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {pack.credits} credits · ${pack.priceUsd}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBuyCreditPack(pack.slug)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(255, 89, 65, 0.08)',
                      color: '#ff5941',
                      border: '1px solid rgba(255, 89, 65, 0.15)',
                    }}
                  >
                    Buy
                  </button>
                </div>
              ))}
            </div>

            {/* View all packs link */}
            <button
              onClick={() => router.push('/settings?tab=billing')}
              className="text-xs font-semibold flex items-center gap-1 transition-colors duration-200 self-start"
              style={{ color: 'var(--text-secondary)' }}
            >
              View all packs
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Back link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
          style={{
            color: 'var(--text-muted)',
            animation: 'paywallSlideUp 0.5s ease-out 0.3s both',
          }}
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes paywallFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes paywallSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
