'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/views/components/AuthProvider';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useProject } from '@/views/components/ProjectProvider';
import { OnboardingFlow } from '@/views/components/onboarding';
import { REFERRAL_STORAGE_KEY } from '@/config/referral';

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { state, loaded, complete } = useOnboarding();
  const { createProject } = useProject();
  const [ready, setReady] = useState(false);
  const referralClaimed = useRef(false);

  // Claim referral code from localStorage after signup
  useEffect(() => {
    if (!user || referralClaimed.current) return;
    referralClaimed.current = true;

    try {
      const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (!code) return;
      localStorage.removeItem(REFERRAL_STORAGE_KEY);

      fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }).catch(() => {
        // Referral is a bonus — silent failure is fine
      });
    } catch {
      // localStorage unavailable
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !loaded) return;
    if (!user) { router.replace('/login'); return; }
    const isReplay = searchParams?.get('replay') === 'true';
    // Users arriving from the try flow skip onboarding and go straight to session
    if (state.cameFromTry) {
      complete(user.user_metadata?.full_name || '');
      router.replace('/session/select-project');
      return;
    }
    if (state.isComplete && !isReplay) { router.replace('/dashboard'); return; }
    setReady(true);
  }, [authLoading, loaded, user, state.isComplete, state.cameFromTry, searchParams, router, complete]);

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
        onComplete={async (name, projectName, projectDescription) => {
          complete(name, projectName, projectDescription);
          // Create project if user provided a name
          if (projectName.trim()) {
            try {
              await createProject({
                name: projectName.trim(),
                description: projectDescription.trim() || undefined,
                setActive: true,
              });
            } catch {
              // Non-critical — they can create a project later
            }
          }
          router.push('/session/select-project');
        }}
        onSkip={() => {
          complete(state.displayName || 'Founder');
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
