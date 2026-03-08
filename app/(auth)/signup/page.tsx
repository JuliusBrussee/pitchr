'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PitchrLogo } from '@/views/components/PitchrLogo';

type ErrorType = 'error' | 'account_exists';

function getFriendlySignupError(message: string): { text: string; type: ErrorType } {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return { text: 'Too many attempts. Please wait a minute and try again.', type: 'error' };
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return { text: 'An account with this email already exists.', type: 'account_exists' };
  }
  if (lower.includes('valid email') || lower.includes('invalid email')) {
    return { text: 'Please enter a valid email address.', type: 'error' };
  }
  if (lower.includes('password') && lower.includes('short')) {
    return { text: 'Password must be at least 8 characters.', type: 'error' };
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return { text: 'Connection error. Please check your internet and try again.', type: 'error' };
  }
  return { text: message, type: 'error' };
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/setup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ text: string; type: ErrorType } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordLength = password.length;
  const passwordStrength = passwordLength === 0 ? 0 : passwordLength < 8 ? 1 : passwordLength < 12 ? 2 : 3;
  const strengthColors = ['transparent', '#ef4444', '#ffaa33', '#22c55e'];
  const strengthLabels = ['', 'Too short', 'Good', 'Strong'];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signUpError) {
        setError(getFriendlySignupError(signUpError.message));
        setIsLoading(false);
        return;
      }

      // Supabase returns a fake user with empty identities for repeated signups
      // to prevent email enumeration. No confirmation email is sent in this case.
      if (data.user?.identities?.length === 0) {
        setError({
          text: 'An account with this email already exists.',
          type: 'account_exists',
        });
        setIsLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setConfirmationSent(true);
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch {
      setError({ text: 'Something went wrong. Please try again.', type: 'error' });
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  if (confirmationSent) {
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
            We sent a confirmation link to
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
            Click the link to activate your account.
            <br />
            Didn&apos;t get it? Check spam or{' '}
            <button
              onClick={() => setConfirmationSent(false)}
              className="font-medium transition-colors duration-200"
              style={{ color: '#ff5941' }}
            >
              try again
            </button>
          </p>
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
            Start your pitch journey
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Create a free account to get your first score
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-xl px-3.5 py-2.5 text-[13px] font-medium flex items-start gap-2.5"
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.12)',
            }}
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              {error.text}
              {error.type === 'account_exists' && (
                <>
                  {' '}
                  <Link
                    href={`/login${redirectTo !== '/setup' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
                    style={{ color: '#ef4444' }}
                  >
                    Sign in instead
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border py-2.5 text-[13px] font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }} />
          </div>
          <div className="relative flex justify-center">
            <span
              className="px-3 text-[11px] font-medium uppercase tracking-widest"
              style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
            >
              or
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <div className="relative">
            <User
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
              style={{ color: focusedField === 'name' ? '#ff5941' : 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
              className="auth-input w-full rounded-xl border py-2.5 pl-10 pr-3 text-[13px] outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: focusedField === 'name' ? 'rgba(255,89,65,0.4)' : 'var(--border-color)',
                color: 'var(--text-primary)',
                boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(255,89,65,0.08)' : 'none',
              }}
            />
          </div>
          <div className="relative">
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
          <div>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: focusedField === 'password' ? '#ff5941' : 'var(--text-muted)' }}
              />
              <input
                type="password"
                placeholder="Password"
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
          <button
            type="submit"
            disabled={isLoading}
            className="auth-btn group relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mt-1"
            style={{
              background: 'linear-gradient(135deg, #ff5941 0%, #e63b26 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(255,89,65,0.25)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="auth-spinner" />
                Creating account...
              </span>
            ) : (
              <>
                Create account
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Value props */}
        <div className="mt-5 flex flex-col gap-2 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
          {['AI-powered pitch scoring in seconds', 'Personalized rewrite suggestions', 'Track your progress over time'].map((text) => (
            <div key={text} className="flex items-center gap-2.5">
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,89,65,0.1)' }}
              >
                <Check size={9} strokeWidth={3} style={{ color: '#ff5941' }} />
              </div>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium no-underline transition-colors duration-200 hover:underline"
          style={{ color: '#ff5941' }}
        >
          Sign in
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
