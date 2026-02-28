'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogCard } from '@/views/components/blog/BlogCard';
import type { BlogPostMeta } from '@/types/blog';

export function LandingBlog() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);

  useEffect(() => {
    fetch('/api/blog/posts')
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="blog-landing-section" id="blog">
      <div className="container">
        <div className="section-label" style={{ textAlign: 'center' }}>
          From the Blog
        </div>
        <h2
          className="section-title"
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          Sharpen your <span className="accent">pitch game.</span>
        </h2>
        <p
          className="section-desc"
          style={{
            textAlign: 'center',
            margin: '0 auto 48px',
            maxWidth: '520px',
          }}
        >
          Frameworks and insights from the world of pitching.
        </p>
        <div className="blog-landing-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
        <div className="blog-landing-cta">
          <Link href="/blog" className="blog-view-all">
            View all articles <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
