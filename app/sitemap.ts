import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { buildCanonicalUrl, PUBLIC_MARKETING_ROUTES } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_MARKETING_ROUTES.map((route) => ({
    url: buildCanonicalUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: buildCanonicalUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.lastModified || post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
  const blogIndex = staticEntries.findIndex((entry) => entry.url === buildCanonicalUrl('/blog'));

  if (blogIndex === -1) {
    return [...staticEntries, ...blogEntries];
  }

  return [
    ...staticEntries.slice(0, blogIndex + 1),
    ...blogEntries,
    ...staticEntries.slice(blogIndex + 1),
  ];
}
