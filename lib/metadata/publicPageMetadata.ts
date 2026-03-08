import type { Metadata } from 'next';
import type { PublicBreadcrumb, PublicPageDefinition } from '@/content/publicPages';
import { buildCanonicalUrl } from '@/lib/site';

function buildPageTitle(page: PublicPageDefinition) {
  return `${page.title} | Pitchr`;
}

export function buildPublicPageMetadata(page: PublicPageDefinition): Metadata {
  const canonicalUrl = buildCanonicalUrl(page.href);
  const title = buildPageTitle(page);
  const imageUrl = buildCanonicalUrl('/og-image.png');

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: page.description,
      url: canonicalUrl,
      siteName: 'Pitchr',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
      images: [imageUrl],
    },
  };
}

export function buildBreadcrumbSchema(items: PublicBreadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: buildCanonicalUrl(item.href),
    })),
  };
}
