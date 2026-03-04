const BASE_URL = 'https://pitchr.live';

const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pitchr',
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    description: 'AI-powered pitch coaching for startup founders.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pitchr',
    url: BASE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Pitchr',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: BASE_URL,
    description:
      'AI pitch coach that scores your pitch, provides ranked fixes, and rewrites your script.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
];

export function HomeJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMAS) }}
    />
  );
}
