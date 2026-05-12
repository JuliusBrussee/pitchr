'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useCompliance } from '@/hooks/useCompliance';

const STEPS = [
  'Transparency',
  'Required Acknowledgements',
  'Optional Consents',
  'Controls',
] as const;

export function ComplianceSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const rawNext = searchParams?.get('next');
    if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//')) {
      return '/dashboard';
    }
    return rawNext;
  }, [searchParams]);

  const { status, isLoading, error, accept } = useCompliance();

  const [currentStep, setCurrentStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!status) return;
    setAnalyticsOptIn(status.analyticsOptIn);
    setMarketingOptIn(status.marketingOptIn);

    if (!status.required || status.completed) {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  const canMoveNext = useMemo(() => {
    if (currentStep === 1) {
      return termsAccepted && privacyAcknowledged;
    }
    return true;
  }, [currentStep, privacyAcknowledged, termsAccepted]);

  const isLastStep = currentStep === STEPS.length - 1;

  const onNext = () => {
    if (!canMoveNext) return;
    setCurrentStep((value) => Math.min(value + 1, STEPS.length - 1));
  };

  const onBack = () => {
    setCurrentStep((value) => Math.max(value - 1, 0));
  };

  const onSubmit = async () => {
    if (!termsAccepted || !privacyAcknowledged) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await accept({
        termsAccepted: true,
        privacyNoticeAcknowledged: true,
        analyticsOptIn,
        marketingOptIn,
      });
      router.replace(nextPath);
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'Failed to save your compliance acknowledgement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto rounded-2xl border p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading compliance check...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
            <ShieldCheck size={20} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              GDPR Compliance Check
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Complete this once to continue using Pitchr in the EEA/UK.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STEPS.map((label, index) => {
            const active = index === currentStep;
            const done = index < currentStep;
            return (
              <div
                key={label}
                className="rounded-lg border px-3 py-2 text-xs font-medium"
                style={{
                  borderColor: active ? '#ff5941' : 'var(--border-color)',
                  color: active ? '#ff5941' : 'var(--text-secondary)',
                  backgroundColor: done ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                }}
              >
                {done ? 'Done - ' : ''}{label}
              </div>
            );
          })}
        </div>

        <section
          className="rounded-2xl border p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
          }}
        >
          {currentStep === 0 && (
            <>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>What we process and why</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Transcript, audio recordings, and deck files to run pitch analysis and coaching.</li>
                <li>Account and usage data to provide product access, history, billing, and support.</li>
                <li>Third-party processors: Supabase, Anthropic, OpenRouter/Google fallback, ElevenLabs, Stripe.</li>
                <li>International transfers use adequacy decisions where available, plus contractual safeguards when needed.</li>
                <li>You can export or delete your data in Settings.</li>
              </ul>
            </>
          )}

          {currentStep === 1 && (
            <>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Required acknowledgements</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These are required to continue with analysis features.
              </p>

              <label className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I accept the <Link href="/terms" className="underline" style={{ color: '#ff5941' }}>Terms of Service</Link>.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={privacyAcknowledged}
                  onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I have read the <Link href="/privacy" className="underline" style={{ color: '#ff5941' }}>Privacy Notice</Link> and understand how my data is processed.
                </span>
              </label>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Optional consents</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You can change these at any time from Settings.
              </p>

              <label className="flex items-center justify-between py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Allow analytics cookies (optional)</span>
                <input
                  type="checkbox"
                  checked={analyticsOptIn}
                  onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>Allow product updates by email (optional)</span>
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
              </label>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Your controls</h2>
              <ul className="list-disc pl-6 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Export all run data in <Link href="/settings" className="underline" style={{ color: '#ff5941' }}>Settings</Link>.</li>
                <li>Delete runs, decks, and account-linked data from Settings and History.</li>
                <li>Update consent settings later from Settings without re-running this flow.</li>
              </ul>
              <div className="rounded-lg p-3 text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#166534' }}>
                <CheckCircle2 size={16} className="mt-0.5" />
                <span>Submitting will save your acknowledgement for policy version {status?.policyVersion ?? 'current'}.</span>
              </div>
            </>
          )}

          {(error || submitError) && (
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {submitError ?? error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              disabled={currentStep === 0 || isSubmitting}
              className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Back
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={onNext}
                disabled={!canMoveNext || isSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 flex items-center gap-1"
                style={{ backgroundColor: '#ff5941' }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!termsAccepted || !privacyAcknowledged || isSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: '#ff5941' }}
              >
                {isSubmitting ? 'Saving...' : 'Agree and continue'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
