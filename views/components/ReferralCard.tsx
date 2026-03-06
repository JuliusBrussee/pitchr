'use client';

import { Gift, Copy, Check, Users, Zap, Clock } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';
import { MAX_REFERRAL_REWARDS, REFERRER_REWARD_CREDITS } from '@/config/referral';

/* ——————————————————————————————————————————————————————————
 * ReferralCard — Referral link, stats, progress, and history
 * Designed to sit inside a SectionCard on the settings page.
 * —————————————————————————————————————————————————————————— */

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.12)', text: '#eab308', label: 'Pending' },
  completed: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', label: 'Completed' },
  rewarded: { bg: 'rgba(34, 197, 94, 0.12)', text: '#22c55e', label: 'Rewarded' },
};

export function ReferralCard() {
  const { referralLink, stats, history, isLoading, isCopied, copyLink } = useReferral();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <div
          className="w-4 h-4 rounded-full animate-pulse"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading referral data...</p>
      </div>
    );
  }

  const rewardsUsed = stats?.rewarded ?? 0;
  const progressPercent = Math.min(100, (rewardsUsed / MAX_REFERRAL_REWARDS) * 100);

  return (
    <div className="space-y-5">
      {/* Referral link */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Your Referral Link
        </p>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm font-mono truncate"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {referralLink ?? '—'}
          </div>
          <button
            onClick={copyLink}
            disabled={!referralLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{
              backgroundColor: isCopied ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Share this link with friends. You both earn 3 bonus credits when they complete their first analysis.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div
          className="grid grid-cols-4 gap-3 rounded-xl p-4"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-color)',
          }}
        >
          <StatItem icon={Users} label="Referred" value={stats.totalReferred} />
          <StatItem icon={Zap} label="Rewarded" value={stats.rewarded} />
          <StatItem icon={Gift} label="Credits Earned" value={stats.creditsEarned} />
          <StatItem icon={Clock} label="Remaining" value={stats.remainingRewards} />
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Reward Progress
          </p>
          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {rewardsUsed} / {MAX_REFERRAL_REWARDS} rewards
          </p>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: '#22c55e',
            }}
          />
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Max {MAX_REFERRAL_REWARDS * REFERRER_REWARD_CREDITS} bonus credits
          ({MAX_REFERRAL_REWARDS} referrals × {REFERRER_REWARD_CREDITS} credits each)
        </p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Referral History
          </p>
          <div className="space-y-1.5">
            {history.map((ref) => {
              const statusInfo = STATUS_COLORS[ref.status] ?? STATUS_COLORS.pending;
              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(ref.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ——— Stat Item ——— */

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-1">
        <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}
