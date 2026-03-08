'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PitchrLogo } from '@/views/components/PitchrLogo';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';
import { isRateLimitError } from '@/lib/supabase/edge-error';

function getFriendlyResetError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  return message;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { isRateLimited, rateLimitMessage, triggerCooldown } = useRateLimitCooldown();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/reset-password`,
      });

      if (resetError) {
        if (isRateLimitError(resetError.message)) {
          triggerCooldown(60);
        }
        setError(getFriendlyResetError(resetError.message));
        setIsLoading(false);
        return;
      }

      setEmailSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error('[auth] forgot-password error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <>
        <div
          className="w-full max-w-[380px] rounded-2xl border p-8 text-center"
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
              background: 'linear-gradient(135deg, rgba(255,89,65,0.12) 0%, rgba(255,170,51,0.12) 100%)',
              boxShadow: '0 0 0 8px rgba(255,89,65,0.04)',
            }}
          >
            <Mail size={24} style={{ color: '#ff5941' }} />
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
            Check your email
          </h1>
          <p className="text-[13px] mb-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            We sent a password reset link to
          </p>
          <p
            className="text-[13px] font-semibold mb-5"
            style={{
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              backgroundColor: 'var(--bg-surface-hover)',
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '6px',
            }}
          >
            {email}
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Click the link to reset your password.
            <br />
            Didn&apos;t get it? Check spam or{' '}
            <button
              onClick={() => setEmailSent(false)}
              className="font-medium transition-colors duration-200"
              style={{ color: '#ff5941' }}
            >
              try again
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium no-underline transition-colors duration-200 hover:underline"
            style={{ color: '#ff5941' }}
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </p>
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
        className="w-full max-w-[380px] rounded-2xl border p-8"
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
            Reset your password
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Enter your email and we&apos;ll send you a reset link
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
            <span>{rateLimitMessage ?? error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative group">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
              style={{ color: focusedField === 'email' ? '#ff5941' : 'var(--text-muted)' }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              className="auth-input w-full rounded-xl border py-2.5 pl-10 pr-3 text-[13px] outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: focusedField === 'email' ? 'rgba(255,89,65,0.4)' : 'var(--border-color)',
                color: 'var(--text-primary)',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(255,89,65,0.08)' : 'none',
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
                Sending link...
              </span>
            ) : isRateLimited ? (
              rateLimitMessage
            ) : (
              <>
                Send reset link
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium no-underline transition-colors duration-200 hover:underline"
          style={{ color: '#ff5941' }}
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </p>

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
