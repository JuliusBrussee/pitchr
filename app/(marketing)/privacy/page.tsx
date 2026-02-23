'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'February 23, 2026';

export default function PrivacyPolicyPage() {
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
              <ShieldCheck size={20} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Privacy Policy
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
          <Section title="1. Overview">
            <p>
              Pitchr (&quot;we&quot;, &quot;us&quot;, &quot;the Service&quot;) is committed to
              protecting your privacy. This policy explains what data we collect, how we process it,
              and your rights regarding your information.
            </p>
            <p>
              <strong>The short version:</strong> We collect only what&apos;s needed to analyze your
              pitch. Most data stays in your browser. We don&apos;t sell your data. We don&apos;t
              require accounts or personal information.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3
              className="text-sm font-semibold mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              2a. Content You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Pitch transcripts</strong> — text you type or that is generated from your
                audio via speech-to-text
              </li>
              <li>
                <strong>Audio recordings</strong> — microphone recordings captured during live
                sessions
              </li>
              <li>
                <strong>Pitch deck files</strong> — PDF/PPTX files you upload for context-aware
                analysis
              </li>
            </ul>

            <h3
              className="text-sm font-semibold mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              2b. Automatically Collected
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Delivery metrics</strong> — words per minute, filler word count, and
                duration, calculated from your audio input
              </li>
              <li>
                <strong>Usage patterns</strong> — session timestamps, pitch modes selected, and
                number of runs (stored locally)
              </li>
            </ul>

            <h3
              className="text-sm font-semibold mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              2c. What We Do NOT Collect
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Names, email addresses, or account credentials (no auth required)</li>
              <li>IP addresses or device fingerprints for tracking purposes</li>
              <li>Video or camera footage (camera preview is local-only and never transmitted)</li>
              <li>Payment or financial information</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <table className="w-full text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Data
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Purpose
                  </th>
                  <th className="text-left py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Destination
                  </th>
                </tr>
              </thead>
              <tbody>
                <TableRow
                  data="Pitch transcript"
                  purpose="AI analysis & scoring"
                  destination="Anthropic (Claude) / Google (Gemini)"
                />
                <TableRow
                  data="Audio recording"
                  purpose="Speech-to-text conversion"
                  destination="ElevenLabs"
                />
                <TableRow
                  data="Deck files"
                  purpose="Cloud storage & slide extraction"
                  destination="Supabase Storage"
                />
                <TableRow
                  data="Analysis results"
                  purpose="Display scores & history"
                  destination="Browser localStorage (your device)"
                />
                <TableRow
                  data="Delivery metrics"
                  purpose="Speaking pace feedback"
                  destination="Browser localStorage (your device)"
                />
              </tbody>
            </table>
          </Section>

          <Section title="4. Third-Party Data Processors">
            <p>
              When you submit a pitch, your transcript is sent to external AI services for analysis.
              These processors handle your data under their own privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Anthropic</strong> — processes transcripts to generate scores and feedback.
                See{' '}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline"
                  style={{ color: '#ff5941' }}
                >
                  Anthropic&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Google AI</strong> — fallback processor when primary service is unavailable.
                See{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline"
                  style={{ color: '#ff5941' }}
                >
                  Google&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>ElevenLabs</strong> — converts audio recordings to text. See{' '}
                <a
                  href="https://elevenlabs.io/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline"
                  style={{ color: '#ff5941' }}
                >
                  ElevenLabs&apos; Privacy Policy
                </a>
              </li>
              <li>
                <strong>Supabase</strong> — stores uploaded deck files. See{' '}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline"
                  style={{ color: '#ff5941' }}
                >
                  Supabase&apos;s Privacy Policy
                </a>
              </li>
            </ul>
            <p className="mt-3">
              We transmit only the minimum data required for each service to function. We do not
              share your data with advertisers, data brokers, or any parties beyond those listed
              above.
            </p>
          </Section>

          <Section title="5. Data Storage & Security">
            <h3
              className="text-sm font-semibold mt-2 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Local Storage
            </h3>
            <p>
              Pitch runs (transcripts, scores, analysis results) are stored in your browser&apos;s
              localStorage. This data never leaves your device after the initial AI processing. It
              persists until you manually clear it or use the &quot;Delete All Data&quot; option in
              Settings.
            </p>

            <h3
              className="text-sm font-semibold mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Cloud Storage
            </h3>
            <p>
              Uploaded pitch deck files are stored in Supabase Storage with a 50 MB size limit per
              file. Deck files can be deleted at any time through the Deck Manager. The current
              version of Pitchr uses public access policies for deck storage (no authentication
              required).
            </p>

            <h3
              className="text-sm font-semibold mt-4 mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Transit Security
            </h3>
            <p>
              All data transmitted between your browser and our servers, as well as between our
              servers and third-party processors, is encrypted using HTTPS/TLS.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Local data:</strong> Retained indefinitely until you clear browser storage or
                delete it via Settings
              </li>
              <li>
                <strong>Deck files:</strong> Retained in cloud storage until you delete them through
                the Deck Manager
              </li>
              <li>
                <strong>AI processor logs:</strong> Subject to each third-party provider&apos;s
                retention policies (see Section 4)
              </li>
            </ul>
          </Section>

          <Section title="7. Your Rights & Controls">
            <p>You have the following controls over your data:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>View</strong> — access all your pitch history and scores at any time
              </li>
              <li>
                <strong>Delete individual runs</strong> — remove specific pitch analyses from history
              </li>
              <li>
                <strong>Delete all data</strong> — wipe all locally stored data via Settings
              </li>
              <li>
                <strong>Delete deck files</strong> — remove uploaded decks from cloud storage
              </li>
              <li>
                <strong>Opt out</strong> — stop using the Service at any time; no account to cancel
              </li>
            </ul>
            <p className="mt-3">
              Since we do not collect personal identifiers, we cannot link stored data to individual
              users. If you need assistance with data deletion from third-party processors, contact
              us and we will help coordinate the request.
            </p>
          </Section>

          <Section title="8. Sensitive Content Warning">
            <div
              className="rounded-xl p-4 mt-2"
              style={{
                backgroundColor: 'rgba(255, 89, 65, 0.08)',
                border: '1px solid rgba(255, 89, 65, 0.2)',
              }}
            >
              <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Your pitches may contain sensitive business information.
              </p>
              <p>
                Pitch transcripts often include proprietary strategies, financial projections,
                customer names, and trade secrets. While we minimize data transmission and store most
                results locally, be aware that submitted transcripts are processed by third-party AI
                services. Avoid including highly confidential information (e.g., exact revenue
                figures, undisclosed partnerships, security credentials) in your pitches if you are
                concerned about third-party processing.
              </p>
            </div>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Pitchr is not intended for use by individuals under 16 years of age. We do not
              knowingly collect data from children.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will be reflected on this
              page with an updated date. Since we don&apos;t collect contact information, we
              recommend checking this page periodically.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related questions or data deletion requests, contact us at{' '}
              <a
                href="mailto:privacy@pitchr.live"
                className="font-medium no-underline hover:underline"
                style={{ color: '#ff5941' }}
              >
                privacy@pitchr.live
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
              href="/terms"
              className="font-medium no-underline hover:underline"
              style={{ color: '#ff5941' }}
            >
              Terms of Service
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

/* ——— Table row sub-component ——— */
function TableRow({
  data,
  purpose,
  destination,
}: {
  data: string;
  purpose: string;
  destination: string;
}) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td className="py-2 pr-4">{data}</td>
      <td className="py-2 pr-4">{purpose}</td>
      <td className="py-2">{destination}</td>
    </tr>
  );
}
