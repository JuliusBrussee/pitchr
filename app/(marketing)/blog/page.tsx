import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllPosts, getCategories } from '@/lib/blog';
import { BlogCard } from '@/views/components/blog/BlogCard';
import { BlogHero } from '@/views/components/blog/BlogHero';
import './blog.css';

export const metadata: Metadata = {
  title: 'Blog — Pitchr',
  description:
    'Tips, frameworks, and insights to help founders deliver investor-ready pitches.',
  openGraph: {
    title: 'Blog — Pitchr',
    description:
      'Tips, frameworks, and insights to help founders deliver investor-ready pitches.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getCategories();
  const featured = posts.find((p) => p.featured) || posts[0];
  const remaining = posts.filter((p) => p.slug !== featured?.slug);

  return (
    <div className="blog-listing">
      <header className="blog-listing-header">
        <Link href="/" className="blog-back-link">
          <ArrowLeft size={16} />
          Back to Pitchr
        </Link>
        <div className="blog-listing-title-wrap">
          <h1 className="blog-listing-title">The Pitchr Blog</h1>
          <p className="blog-listing-subtitle">
            Frameworks, tips, and insights to help founders nail every pitch.
          </p>
        </div>
        {categories.length > 1 && (
          <div className="blog-categories">
            {categories.map((cat) => (
              <span key={cat} className="blog-category-pill">
                {cat}
              </span>
            ))}
          </div>
        )}
      </header>

      {featured && <BlogHero post={featured} />}

      {remaining.length > 0 && (
        <div className="blog-grid">
          {remaining.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="blog-empty">
          <p>No posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
