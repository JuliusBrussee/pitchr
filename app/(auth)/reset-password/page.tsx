'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PitchrLogo } from '@/views/components/PitchrLogo';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { isRateLimitError } from '@/lib/supabase/edge-error';

function getFriendlyUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('same password') || lower.includes('different password') || lower.includes('should be different')) {
    return 'New password must be different from your current password.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (lower.includes('session') || lower.includes('not authenticated') || lower.includes('refresh_token')) {
    return 'Your reset link has expired. Please request a new one.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  return message;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { isRateLimited, rateLimitMessage, triggerCooldown } = useRateLimitCooldown();

  const passwordLength = password.length;
  const passwordStrength = passwordLength === 0 ? 0 : passwordLength < 8 ? 1 : passwordLength < 12 ? 2 : 3;
  const strengthColors = ['transparent', '#ef4444', '#ffaa33', '#22c55e'];
  const strengthLabels = ['', 'Too short', 'Good', 'Strong'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        if (isRateLimitError(updateError.message)) {
          triggerCooldown(60);
        }
        setError(getFriendlyUpdateError(updateError.message));
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error('[auth] reset-password error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <>
        <div
          className="w-full max-w-[380px] rounded-2xl border p-6 sm:p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(var(--blur-strength))',
            boxShadow: '0 0 0 1px rgba(255,89,65,0.04), 0 24px 48px -12px rgba(0,0,0,0.18)',
          }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.08) 100%)',
              boxShadow: '0 0 0 8px rgba(34,197,94,0.04)',
            }}
          >
            <CheckCircle size={24} style={{ color: '#22c55e' }} />
          </div>
          <h1
            className="text-[24px] mb-2"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            Password updated
          </h1>
          <p className="text-[13px] mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your password has been successfully changed.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(255,89,65,0.25)',
            }}
          >
            Continue to dashboard
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5 no-underline transition-opacity hover:opacity-80"
      >
        <PitchrLogo size={28} />
        <span
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
        >
          pitchr
        </span>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-[380px] rounded-2xl border p-6 sm:p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          backdropFilter: 'blur(var(--blur-strength))',
          boxShadow: '0 0 0 1px rgba(255,89,65,0.04), 0 24px 48px -12px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div className="mb-7">
          <h1
            className="text-[28px] mb-1.5"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Set new password
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Choose a strong password for your account
          </p>
        </div>

        {/* Error */}
        {(rateLimitMessage ?? error) && (
          <div
            className="mb-4 rounded-xl px-3.5 py-2.5 text-[13px] font-medium flex items-start gap-2.5"
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.12)',
            }}
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              {rateLimitMessage ?? error}
              {!rateLimitMessage && error?.includes('expired') && (
                <>
                  {' '}
                  <Link
                    href="/forgot-password"
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
                    style={{ color: '#ef4444' }}
                  >
                    Request new link
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <div className="relative group">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: focusedField === 'password' ? '#ff5941' : 'var(--text-muted)' }}
              />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                minLength={8}
                className="auth-input w-full rounded-xl border py-2.5 pl-10 pr-3 text-[13px] outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: focusedField === 'password' ? 'rgba(255,89,65,0.4)' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                  boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(255,89,65,0.08)' : 'none',
                }}
              />
            </div>
            {/* Password strength */}
            {passwordLength > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: passwordStrength >= level ? strengthColors[passwordStrength] : 'var(--border-color)',
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[11px] font-medium transition-colors duration-300"
                  style={{ color: strengthColors[passwordStrength] }}
                >
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>
          <div className="relative group">
            <Lock
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
              style={{ color: focusedField === 'confirm' ? '#ff5941' : 'var(--text-muted)' }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              required
              minLength={8}
              className="auth-input w-full rounded-xl border py-2.5 pl-10 pr-3 text-[13px] outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: focusedField === 'confirm' ? 'rgba(255,89,65,0.4)' : 'var(--border-color)',
                color: 'var(--text-primary)',
                boxShadow: focusedField === 'confirm' ? '0 0 0 3px rgba(255,89,65,0.08)' : 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || isRateLimited}
            className="auth-btn group relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mt-1"
            style={{
              background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(255,89,65,0.25)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="auth-spinner" />
                Updating password...
              </span>
            ) : isRateLimited ? (
              rateLimitMessage
            ) : (
              <>
                Update password
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .auth-input::placeholder {
          color: var(--text-muted);
          font-size: 13px;
        }

        .auth-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: authSpin 0.6s linear infinite;
        }

        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
