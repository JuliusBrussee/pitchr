'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const LAST_UPDATED = 'March 4, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in-up" style={{ animationFillMode: 'backwards' }}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Privacy Notice
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div
          className="rounded-2xl border p-8 animate-fade-in-up space-y-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
            borderColor: 'var(--border-color)',
            animationDelay: '80ms',
            animationFillMode: 'backwards',
          }}
        >
          <Section title="1. Who We Are">
            <p>
              Pitchr is an AI pitch coaching product. This notice explains what personal data we process,
              why we process it, and the controls available to you.
            </p>
          </Section>

          <Section title="2. Data We Process">
            <ul className="list-disc pl-6 space-y-1">
              <li>Account data (for login and product access).</li>
              <li>Pitch content you submit, including transcript, optional audio recording, and optional deck files.</li>
              <li>Run outputs such as scoring, feedback, and derived delivery metrics.</li>
              <li>Operational data for billing, usage limits, and reliability diagnostics.</li>
              <li>Optional analytics and marketing preferences when you opt in.</li>
            </ul>
          </Section>

          <Section title="3. Legal Bases">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Contract:</strong> required processing to provide the coaching service you request.
              </li>
              <li>
                <strong>Consent:</strong> optional processing for analytics cookies and marketing emails.
              </li>
            </ul>
            <p>
              For EEA/UK users, we require a compliance acknowledgement before analysis features are available.
            </p>
          </Section>

          <Section title="4. Processors And Transfers">
            <p>We use service providers to operate Pitchr, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Supabase (database, authentication, storage).</li>
              <li>LLM providers such as Anthropic and fallback providers for analysis.</li>
              <li>ElevenLabs for speech features when enabled.</li>
              <li>Stripe for billing and subscription management.</li>
            </ul>
            <p>
              Where personal data is transferred internationally, we rely on adequacy decisions when available and
              contractual safeguards where required.
            </p>
          </Section>

          <Section title="5. Retention">
            <p>
              We keep account and run data while your account is active unless you delete specific records or request
              deletion. You can export or delete your run history in Settings.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <ul className="list-disc pl-6 space-y-1">
              <li>Access and correction.</li>
              <li>Erasure and restriction where applicable.</li>
              <li>Data portability where applicable.</li>
              <li>Withdraw optional consent at any time in Settings.</li>
            </ul>
          </Section>

          <Section title="7. Cookies And Analytics">
            <p>
              Analytics scripts are loaded only when you opt in. You can change this preference anytime from Settings.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              For privacy requests, contact{' '}
              <a href="mailto:privacy@pitchr.live" className="font-medium no-underline hover:underline" style={{ color: '#ff5941' }}>
                privacy@pitchr.live
              </a>
              .
            </p>
          </Section>

          <div className="pt-6 mt-8 text-sm" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            See also:{' '}
            <Link href="/terms" className="font-medium no-underline hover:underline" style={{ color: '#ff5941' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}