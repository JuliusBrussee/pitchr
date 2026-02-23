'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  async function handleGoogleLogin() {
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

  return (
    <div
      className="w-full max-w-sm rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sign in to your Pitchr account
        </p>
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-3 mb-4">
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#ff5941' }}
        >
          <LogIn size={16} />
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'var(--border-color)' }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            or
          </span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:opacity-80"
        style={{
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
          backgroundColor: 'transparent',
        }}
      >
        <Globe size={16} />
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium no-underline hover:underline"
          style={{ color: '#ff5941' }}
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
