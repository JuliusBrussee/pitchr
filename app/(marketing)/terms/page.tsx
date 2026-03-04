'use client';

import Link from 'next/link';
import { ArrowLeft, ScrollText } from 'lucide-react';

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

export default function TermsOfServicePage() {
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
              <ScrollText size={20} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Terms of Service
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
          <Section title="1. Agreement">
            <p>
              By using Pitchr, you agree to these Terms. If you do not agree, do not use the service.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              Pitchr provides AI-powered pitch coaching features, including analysis, scoring, recommendations,
              and related workflow tools.
            </p>
          </Section>

          <Section title="3. Accounts And Access">
            <p>
              Access to protected product features requires authentication. You are responsible for activity under your account.
            </p>
          </Section>

          <Section title="4. Your Content">
            <p>
              You retain ownership of your submitted content. You grant Pitchr a limited license to process that content to provide
              the service.
            </p>
          </Section>

          <Section title="5. Data Processing And Compliance">
            <p>
              We process required service data under contract and optional analytics/marketing data under consent.
              EEA/UK users may be required to complete a compliance check before analysis features are available.
            </p>
          </Section>

          <Section title="6. Acceptable Use">
            <ul className="list-disc pl-6 space-y-1">
              <li>No unlawful use.</li>
              <li>No attempts to disrupt, reverse engineer, or abuse the service.</li>
              <li>No misuse of automated extraction/scraping at scale.</li>
            </ul>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              Pitchr relies on external providers such as Supabase, model providers, ElevenLabs, and Stripe.
              Your use of Pitchr may involve processing through these providers.
            </p>
          </Section>

          <Section title="8. Disclaimers">
            <p>
              The service is provided "as is". AI outputs are guidance, not legal, financial, or investment advice.
            </p>
          </Section>

          <Section title="9. Liability">
            <p>
              To the maximum extent permitted by law, Pitchr is not liable for indirect or consequential damages resulting from service use.
            </p>
          </Section>

          <Section title="10. Changes">
            <p>
              We may update these Terms and related policies. Updated versions will include a revised date.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For legal questions, contact{' '}
              <a href="mailto:legal@pitchr.live" className="font-medium no-underline hover:underline" style={{ color: '#ff5941' }}>
                legal@pitchr.live
              </a>
              .
            </p>
          </Section>

          <div className="pt-6 mt-8 text-sm" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
            See also:{' '}
            <Link href="/privacy" className="font-medium no-underline hover:underline" style={{ color: '#ff5941' }}>
              Privacy Notice
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}