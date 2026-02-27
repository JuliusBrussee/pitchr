'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/views/components/AuthProvider';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingFlow } from '@/views/components/onboarding';

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { state, loaded, complete } = useOnboarding();
  const [ready, setReady] = useState(false);
  const toProjectType = (mode: 'elevator' | 'vc_pitch') =>
    mode === 'elevator' ? 'elevator_pitch' : 'two_min_pitch';

  useEffect(() => {
    if (authLoading || !loaded) return;
    if (!user) { router.replace('/login'); return; }
    const isReplay = searchParams.get('replay') === 'true';
    // Users arriving from the try flow skip onboarding and go straight to session
    if (state.cameFromTry) {
      const mode = state.preferredMode || 'elevator';
      complete(user.user_metadata?.full_name || '', mode);
      router.replace(`/session/select-project?projectType=${toProjectType(mode)}`);
      return;
    }
    if (state.isComplete && !isReplay) { router.replace('/dashboard'); return; }
    setReady(true);
  }, [authLoading, loaded, user, state.isComplete, state.cameFromTry, state.preferredMode, searchParams, router, complete]);

  if (!ready) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <style>{`
        /* Hide the app sidebar when setup is open */
        .fixed.inset-y-0.left-0.z-40,
        button[aria-label="Toggle menu"] {
          display: none !important;
        }
      `}</style>
      <OnboardingFlow
        onComplete={(name, mode) => {
          complete(name, mode);
          router.push(`/session/select-project?projectType=${toProjectType(mode)}`);
        }}
        onSkip={() => {
          complete(state.displayName || 'Founder', state.preferredMode);
          router.push('/dashboard');
        }}
      />
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <SetupPageInner />
    </Suspense>
  );
}
