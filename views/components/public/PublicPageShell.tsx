import Link from 'next/link';
import type { PublicPageDefinition } from '@/content/publicPages';
import { buildBreadcrumbSchema } from '@/lib/metadata/publicPageMetadata';
import { PublicPageHeroVisual, PublicPageScrollReveal } from '@/views/components/public/PublicPageClient';
import { PublicFaq } from '@/views/components/public/PublicFaq';
import { PublicRelatedLinks } from '@/views/components/public/PublicRelatedLinks';

export function PublicPageShell({ page }: { page: PublicPageDefinition }) {
  const breadcrumbSchema = buildBreadcrumbSchema(page.breadcrumbs);

  return (
    <main className="public-page">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── Hero ── */}
      <section className="pp-hero">
        <div className="pp-hero-bg">
          <div className="pp-hero-spot pp-hero-spot-1" />
          <div className="pp-hero-spot pp-hero-spot-2" />
        </div>

        <div className="pp-hero-content">
          <nav className="pp-hero-breadcrumbs" aria-label="Breadcrumbs">
            <ol className="pp-breadcrumbs">
              {page.breadcrumbs.map((item, index) => {
                const isLast = index === page.breadcrumbs.length - 1;
                return (
                  <li key={item.href} className="pp-breadcrumb-item">
                    {isLast ? (
                      <span className="pp-breadcrumb-current" aria-current="page">
                        {item.label}
                      </span>
                    ) : (
                      <>
                        <Link href={item.href} className="pp-breadcrumb-link">
                          {item.label}
                        </Link>
                        <span className="pp-breadcrumb-sep" aria-hidden="true">
                          /
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <p className="pp-eyebrow">{page.hero.eyebrow}</p>
          <h1 className="pp-hero-question">{page.hero.question}</h1>
          <p className="pp-hero-answer">{page.hero.answer}</p>
        </div>

        <PublicPageHeroVisual pageKey={page.key} />
      </section>

      {/* ── Body ── */}
      <div className="pp-body">
        {/* Sections */}
        <div className="pp-sections">
          {page.sections.map((section, i) => (
            <PublicPageScrollReveal
              key={section.title}
              className="pp-section-card"
              delay={i * 100}
            >
              <div className="pp-section-number">{i + 1}</div>
              <h2 className="pp-section-title">{section.title}</h2>
              <p className="pp-section-body">{section.body}</p>
            </PublicPageScrollReveal>
          ))}
        </div>

        {/* FAQ */}
        <PublicPageScrollReveal className="pp-faq" delay={0}>
          <PublicFaq items={page.faqs} />
        </PublicPageScrollReveal>

        {/* Related Links */}
        <PublicPageScrollReveal className="pp-related" delay={0}>
          <PublicRelatedLinks items={page.relatedLinks} currentHref={page.href} />
        </PublicPageScrollReveal>

        {/* CTA Banner */}
        <PublicPageScrollReveal className="pp-cta-banner" delay={0}>
          <h2 className="pp-cta-banner-title">Ready to sharpen your pitch?</h2>
          <p className="pp-cta-banner-desc">
            Start with a free analysis and see where you stand.
          </p>
          <Link href="/#waitlist" className="pp-cta-button">
            Get Started Free
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </PublicPageScrollReveal>
      </div>
    </main>
  );
}
