import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
      ],
      },
    ],
    sitemap: 'https://pitchr.live/sitemap.xml',
  };
}
