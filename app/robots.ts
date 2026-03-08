import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = [
  '/api/',
  '/auth/',
  '/dashboard',
  '/session',
  '/history',
  '/analytics',
  '/progress',
  '/results/',
  '/review/',
  '/qa/',
  '/deck',
  '/settings',
  '/projects',
  '/demo',
  '/setup',
  '/compliance',
  '/arena',
  '/orb-preview',
  '/try',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      // Explicitly allow AI crawlers for GenAI citation
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: 'https://pitchr.live/sitemap.xml',
  };
}
