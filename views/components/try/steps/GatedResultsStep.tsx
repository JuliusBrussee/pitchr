'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Globe, Sparkles } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';
import { CategoryBar, ScoreBadge, getRubricColor } from '@/views/components/ui';
import { DEMO_SCORES } from '@/config/onboarding';
import { TRY_DEMO_SCORE } from '@/config/try-flow';
import { createClient } from '@/lib/supabase/client';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { PitchMode } from '@/types/pitch';

interface GatedResultsStepProps {
  mode: PitchMode;
}

type Phase = 'analyzing' | 'score-reveal' | 'gated';

export function GatedResultsStep({ mode }: GatedResultsStepProps) {
  const router = useRouter();
  const { markCameFromTry } = useOnboarding();
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [activeIndicator, setActiveIndicator] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
  const [showGate, setShowGate] = useState(false);

  // Auth state
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scoreAnimRef = useRef<number | null>(null);

  // Phase 1: Analyzing — sequential indicator dots
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_SCORES.rubric.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveIndicator(i), 700 * (i + 1)));
    });
    timers.push(setTimeout(() => setPhase('score-reveal'), 4000));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Phase 2: Score reveal — animate counter 0 → TRY_DEMO_SCORE
  useEffect(() => {
    if (phase !== 'score-reveal') return;
    const startTime = performance.now();
    const duration = 1500;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(TRY_DEMO_SCORE * eased));
      if (progress < 1) {
        scoreAnimRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setPhase('gated');
          setTimeout(() => setShowGate(true), 100);
        }, 1200);
      }
    };
    scoreAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (scoreAnimRef.current) cancelAnimationFrame(scoreAnimRef.current);
    };
  }, [phase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
    }

    markCameFromTry();
    router.push(`/session/select-project`);
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(`/session/select-project`)}`,
      },
    });
    if (error) setAuthError(error.message);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 py-8 overflow-hidden">
      {/* Background results (blurred when gated) */}
      <div
        className="flex flex-col items-center gap-6 w-full max-w-lg transition-all duration-700"
        style={{
          filter: phase === 'gated' ? 'blur(20px)' : 'none',
          transform: phase === 'gated' ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        <div style={{ width: 120, height: 120 }}>
          <SiriBubble state={phase === 'analyzing' ? 'active' : 'negative'} />
        </div>

        {phase === 'analyzing' && (
          <>
            <p
              className="text-lg font-medium animate-pulse"
              style={{ color: 'var(--text-secondary)' }}
            >
              Analyzing your pitch...
            </p>
            <div className="flex items-center gap-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <div
                  key={item.category}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= activeIndicator
                      ? getRubricColor(item.category)
                      : 'var(--border-color)',
                    transform: i === activeIndicator ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {(phase === 'score-reveal' || phase === 'gated') && (
          <>
            <p className="text-6xl font-bold tabular-nums" style={{ color: '#ef4444' }}>
              {displayScore}
            </p>
            <ScoreBadge score={TRY_DEMO_SCORE} showLabel />

            <div className="w-full space-y-3">
              {DEMO_SCORES.rubric.map((item, i) => (
                <CategoryBar
                  key={item.category}
                  label={item.label}
                  score={item.score}
                  maxScore={item.maxScore}
                  color={getRubricColor(item.category)}
                  delay={i}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Gate overlay */}
      {phase === 'gated' && (
        <div
          className="absolute inset-0 flex items-center justify-center px-6 transition-all duration-500"
          style={{
            opacity: showGate ? 1 : 0,
            transform: showGate ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex flex-col items-center mb-6">
              <p className="text-3xl font-bold" style={{ color: '#ff5941' }}>
                {TRY_DEMO_SCORE}/100
              </p>
              <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
                We found 5 things to fix.
              </p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Sparkles size={12} />
                Sign up to unlock your full feedback
              </p>
            </div>

            {authError && (
              <div
                className="mb-4 rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-3 mb-4">
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
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none"
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
                  minLength={6}
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none"
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
                {isLoading
                  ? (isSignUp ? 'Creating account...' : 'Signing in...')
                  : (isSignUp ? 'Create account' : 'Sign in')
                }
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
              onClick={handleGoogleAuth}
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

            <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                className="font-medium hover:underline"
                style={{ color: '#ff5941' }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
