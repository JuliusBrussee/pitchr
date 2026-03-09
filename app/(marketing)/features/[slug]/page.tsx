import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { FEATURES, getFeatureBySlug } from '@/config/features';

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};
  return {
    title: `${feature.label} — Pitchr`,
    description: feature.tagline,
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  return (
    <div className="feature-page" style={{ '--feature-color': feature.color } as React.CSSProperties}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        {/* Hero */}
        <section className="feature-hero">
          <span className="feature-label-pill" style={{ backgroundColor: feature.color }}>
            {feature.label}
          </span>
          <h1 className="feature-headline">{feature.headline}</h1>
          <p className="feature-tagline">{feature.tagline}</p>
        </section>

        {/* Benefits */}
        <section className="feature-benefits">
          <div className="feature-benefits-grid">
            {feature.benefits.map((b) => (
              <div key={b.title} className="feature-benefit">
                <div className="feature-benefit-icon">{b.icon}</div>
                <div className="feature-benefit-title">{b.title}</div>
                <div className="feature-benefit-desc">{b.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="feature-cta-section">
          <h2 className="feature-cta-title">Ready to level up your pitch?</h2>
          <Link
            href="/#waitlist"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: feature.color,
              textDecoration: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            Join the Waitlist
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <div>
            <Link href="/" className="feature-back">&larr; Back to home</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
