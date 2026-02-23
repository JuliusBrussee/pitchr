'use client';

import Link from 'next/link';
import { ScrollText, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'February 23, 2026';

export default function TermsOfServicePage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up" style={{ animationFillMode: 'backwards' }}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: 'var(--bg-surface-hover)' }}
            >
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

        {/* Content */}
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
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Pitchr (&quot;the Service&quot;), operated at pitchr.live, you
              agree to be bound by these Terms of Service. If you do not agree to these terms, do
              not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Pitchr is an AI-powered pitch coaching platform that analyzes startup pitches and
              provides scoring, feedback, and rewritten scripts. The Service accepts audio
              recordings, text transcripts, and pitch deck files as input and processes them using
              third-party AI models to generate analysis results.
            </p>
          </Section>

          <Section title="3. User Content & Intellectual Property">
            <p>
              <strong>You retain full ownership of all content you submit</strong>, including pitch
              transcripts, audio recordings, and uploaded deck files. Pitchr does not claim any
              intellectual property rights over your content.
            </p>
            <p>
              By using the Service, you grant Pitchr a limited, non-exclusive license to process
              your content solely for the purpose of providing the analysis service. This license
              terminates when you delete your content or cease using the Service.
            </p>
            <p>
              You represent that you have the right to submit any content you provide and that your
              content does not infringe on the intellectual property rights of any third party.
            </p>
          </Section>

          <Section title="4. Third-Party AI Processing">
            <p>Your content is processed by third-party AI services, including:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Anthropic (Claude)</strong> — primary analysis engine for pitch scoring and
                feedback
              </li>
              <li>
                <strong>Google (Gemini)</strong> — fallback analysis when primary service is
                unavailable
              </li>
              <li>
                <strong>ElevenLabs</strong> — speech-to-text conversion for audio recordings
              </li>
            </ul>
            <p className="mt-3">
              These services process your content under their own terms and privacy policies. Pitchr
              transmits only the minimum data necessary for analysis. We recommend reviewing each
              provider&apos;s data handling practices if you have concerns about sensitive content.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Submit content that contains malware or harmful code</li>
              <li>Attempt to reverse-engineer, decompile, or extract source code from the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>
                Use automated tools to scrape, crawl, or extract data from the Service at scale
              </li>
              <li>Resell or redistribute the Service without written permission</li>
            </ul>
          </Section>

          <Section title="6. Data Storage & Retention">
            <p>
              Pitch run data (transcripts, scores, analysis results) is stored locally in your
              browser&apos;s localStorage. This data remains on your device and is not transmitted to
              Pitchr servers after initial processing.
            </p>
            <p>
              Uploaded pitch deck files are stored in cloud storage (Supabase). You can delete
              uploaded decks at any time through the Deck Manager.
            </p>
            <p>
              Clearing your browser data or using the &quot;Delete All Data&quot; option in Settings
              will permanently remove locally stored pitch data. This action is irreversible.
            </p>
          </Section>

          <Section title="7. No Authentication / Anonymous Access">
            <p>
              The current version of Pitchr does not require account creation or authentication. All
              usage is anonymous. This means there is no way to recover your data if you clear your
              browser storage or switch devices.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied. Pitchr does not guarantee that:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>AI-generated scores or feedback will be accurate or complete</li>
              <li>The Service will be uninterrupted or error-free</li>
              <li>Analysis results constitute professional investment or business advice</li>
            </ul>
            <p className="mt-3">
              <strong>Pitchr is a coaching tool, not a substitute for professional advisors.</strong>{' '}
              Pitch scores are generated by AI models and should be treated as directional feedback,
              not definitive assessments of your pitch&apos;s viability.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Pitchr and its operators shall not
              be liable for any indirect, incidental, special, consequential, or punitive damages,
              including but not limited to loss of profits, data, or business opportunities, arising
              from your use of or inability to use the Service.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. Continued use of the Service after
              changes constitutes acceptance of the revised terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these Terms, contact us at{' '}
              <a
                href="mailto:legal@pitchr.live"
                className="font-medium no-underline hover:underline"
                style={{ color: '#ff5941' }}
              >
                legal@pitchr.live
              </a>
              .
            </p>
          </Section>

          {/* Cross-link */}
          <div
            className="pt-6 mt-8 text-sm"
            style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            See also:{' '}
            <Link
              href="/privacy"
              className="font-medium no-underline hover:underline"
              style={{ color: '#ff5941' }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ——— Section sub-component ——— */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed space-y-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </div>
    </section>
  );
}
