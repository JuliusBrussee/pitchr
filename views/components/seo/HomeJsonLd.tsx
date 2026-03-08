import { buildCanonicalUrl, getSiteUrl } from '@/lib/site';

export function HomeJsonLd() {
  const siteUrl = getSiteUrl();
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Pitchr',
      url: siteUrl,
      logo: buildCanonicalUrl('/icon.svg'),
      description: 'AI-powered pitch coaching for startup founders.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Pitchr',
      url: siteUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Pitchr',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description:
        'AI pitch coach that scores your pitch, provides ranked fixes, and rewrites your script.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}
