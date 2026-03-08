import { PUBLIC_PAGES, PUBLIC_PAGE_ORDER } from '@/content/publicPages';

const DEFAULT_SITE_URL = 'https://pitchr.live';

export interface PublicRouteDefinition {
  path: string;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_SITE_URL);
}

export function buildCanonicalUrl(pathname: string) {
  if (/^https?:\/\//.test(pathname)) {
    return pathname;
  }

  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return normalizedPathname === '/'
    ? getSiteUrl()
    : `${getSiteUrl()}${normalizedPathname}`;
}

export const PUBLIC_MARKETING_ROUTES: PublicRouteDefinition[] = [
  {
    path: '/',
    changeFrequency: 'weekly',
    priority: 1,
  },
  ...PUBLIC_PAGE_ORDER.map((key) => ({
    path: PUBLIC_PAGES[key].href,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  {
    path: '/blog',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    path: '/about',
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    path: '/terms',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    path: '/privacy',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
];
