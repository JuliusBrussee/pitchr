import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPostMeta, BlogPost } from '@/types/blog';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);

    return {
      title: data.title,
      date: data.date,
      lastModified: data.lastModified || null,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      readingTime: data.readingTime || calculateReadingTime(content),
      featured: data.featured || false,
      slug,
    } as BlogPostMeta;
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    meta: {
      title: data.title,
      date: data.date,
      lastModified: data.lastModified || null,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      readingTime: data.readingTime || calculateReadingTime(content),
      featured: data.featured || false,
      slug,
    },
    content,
  };
}

export function getRelatedPosts(slug: string, category: string, limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))];
}
