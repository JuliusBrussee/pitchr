import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Pitchr is an AI pitch coach for startup founders. Record or paste your pitch, get an investor-grade score, ranked fixes, a rewritten script, and delivery metrics.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About',
    description:
      'Pitchr is an AI pitch coach for startup founders. Record or paste your pitch, get an investor-grade score, ranked fixes, and delivery metrics.',
    type: 'website',
  },
};

const BASE_URL = 'https://pitchr.live';

const FAQ_ITEMS = [
  {
    question: 'What is Pitchr?',
    answer:
      'Pitchr is an AI-powered pitch coach that scores your pitch out of 100, gives you ranked fixes, rewrites your script, and measures delivery (pace, fillers, pauses). You can record live or paste a transcript.',
  },
  {
    question: 'Who is Pitchr for?',
    answer:
      'Pitchr is for startup founders, first-time pitchers, and anyone preparing for investor meetings, demo days, or pitch competitions. It helps you tighten your message and improve delivery before you step in the room.',
  },
  {
    question: 'How does scoring work?',
    answer:
      'Pitchr evaluates your pitch across five categories: structure, clarity, evidence, market, and delivery. You get an overall score out of 100 plus a prioritized list of fixes. The AI can also rewrite sections of your script.',
  },
  {
    question: 'Can I practice with audio or text?',
    answer:
      'Yes. You can record your pitch with your microphone (live analysis) or paste a written transcript. Both modes support elevator and full VC-style pitch formats.',
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-base font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
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

export default function AboutPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div
          className="mb-8 animate-fade-in-up"
          style={{ animationFillMode: 'backwards' }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={14} />
            Back to Pitchr
          </Link>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            About Pitchr
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            AI pitch coach for founders
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
          <Section title="What is Pitchr?">
            <p>
              Pitchr is an AI pitch coach that helps startup founders deliver
              investor-ready pitches. You record or paste your pitch, and in
              under 30 seconds you get an investor-grade score out of 100,
              a prioritized list of fixes, a rewritten script, and delivery
              metrics (pace, filler words, pauses).
            </p>
          </Section>

          <Section title="Who is it for?">
            <p>
              Pitchr is built for founders preparing for seed or Series A
              meetings, demo days, and pitch competitions. Whether you are
              a first-time founder or refining your narrative, Pitchr
              surfaces blind spots and gives you concrete improvements
              instead of generic advice.
            </p>
          </Section>

          <Section title="Key features">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Score out of 100</strong> — Evaluated across structure,
                clarity, evidence, market, and delivery.
              </li>
              <li>
                <strong>Ranked fixes</strong> — Prioritized feedback so you
                know what to change first.
              </li>
              <li>
                <strong>AI rewrite</strong> — Get a tightened script based on
                your content and the rubric.
              </li>
              <li>
                <strong>Delivery metrics</strong> — Words per minute, filler
                detection, and pause analysis when you record live.
              </li>
              <li>
                <strong>Two modes</strong> — Elevator pitch or full VC-style
                pitch; audio or text input.
              </li>
            </ul>
          </Section>

          <Section title="FAQ">
            <dl className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <dt
                    className="font-medium mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.question}
                  </dt>
                  <dd
                    className="text-sm pl-0"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            Go to Pitchr
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>
      </div>
    </main>
  );
}
