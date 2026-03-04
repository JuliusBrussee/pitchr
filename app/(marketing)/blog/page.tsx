import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllPosts, getCategories } from '@/lib/blog';
import { BlogCard } from '@/views/components/blog/BlogCard';
import { BlogHero } from '@/views/components/blog/BlogHero';
import './blog.css';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips, frameworks, and insights to help founders deliver investor-ready pitches.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | Pitchr',
    description:
      'Tips, frameworks, and insights to help founders deliver investor-ready pitches.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Pitchr',
    description:
      'Tips, frameworks, and insights to help founders deliver investor-ready pitches.',
  },
};

const TICKER_ITEMS = [
  'Pitch Tips', 'Founder Insights', 'Startup Strategy',
  'Investor Relations', 'Storytelling', 'Fundraising',
  'Pitch Tips', 'Founder Insights', 'Startup Strategy',
  'Investor Relations', 'Storytelling', 'Fundraising',
];

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getCategories();
  const featured = posts.find((p) => p.featured) || posts[0];
  const remaining = posts.filter((p) => p.slug !== featured?.slug);
  const issueDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="blog-listing">
      {/* Marquee ticker */}
      <div className="blog-ticker">
        <div className="blog-ticker-track">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="blog-ticker-text">
              {item} <span className="ticker-dot">&middot;</span>
            </span>
          ))}
        </div>
      </div>

      <header className="blog-listing-header">
        <div className="blog-header-top">
          <Link href="/" className="blog-back-link">
            <ArrowLeft size={14} />
            Back to Pitchr
          </Link>
          <span className="blog-listing-issue">{issueDate}</span>
        </div>

        <div className="blog-header-divider" />

        <div className="blog-listing-title-wrap">
          <h1 className="blog-listing-title">
            The Pitch{' '}
            <span className="title-accent">Journal</span>
          </h1>
          <p className="blog-listing-subtitle">
            Frameworks, tips, and insights to help founders nail every pitch.
          </p>
        </div>

        {categories.length > 1 && (
          <>
            <div className="blog-header-divider" />
            <div className="blog-categories">
              {categories.map((cat) => (
                <span key={cat} className="blog-category-pill">
                  {cat}
                </span>
              ))}
            </div>
          </>
        )}
      </header>

      {featured && (
        <>
          <div className="blog-section-label">Featured</div>
          <BlogHero post={featured} />
        </>
      )}

      {remaining.length > 0 && (
        <>
          <div className="blog-section-label">Latest Articles</div>
          <div className="blog-grid">
            {remaining.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i + 1} />
            ))}
          </div>
        </>
      )}

      {posts.length === 0 && (
        <div className="blog-empty">
          <p>No posts yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
