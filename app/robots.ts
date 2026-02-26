import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/session', '/history', '/analytics', '/progress', '/deck', '/settings', '/results/', '/review/', '/qa/'],
      },
    ],
    sitemap: 'https://pitchr.app/sitemap.xml',
  };
}
