'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';
import '@/app/(marketing)/blog/blog.css';

export function LandingBlog({ posts }: { posts: BlogPostMeta[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (posts.length === 0 || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    );

    sectionRef.current.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [posts]);

  if (posts.length === 0) return null;

  const featured = posts[0];
  const secondary = posts.slice(1, 3);

  return (
    <section className="journal-section" id="blog" aria-label="From the Journal" ref={sectionRef}>
      <div className="container">
        {/* Editorial header */}
        <div className="journal-header reveal">
          <div className="journal-header-line" />
          <div className="journal-header-content">
            <span className="journal-eyebrow">From the Journal</span>
            <h2 className="journal-title">
              Sharpen your{' '}
              <span className="accent"><i>pitch game.</i></span>
            </h2>
            <p className="journal-subtitle">
              Frameworks, insights, and hard-won lessons from the world of fundraising and founder storytelling.
            </p>
          </div>
        </div>

        {/* Magazine layout */}
        <div className="journal-grid reveal">
          {/* Featured — large left column */}
          <Link href={`/blog/${featured.slug}`} className="journal-featured" aria-label={`Read: ${featured.title}`}>
            <div className="journal-featured-visual">
              <div className="journal-featured-image-wrap">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 58vw"
                    className="journal-featured-image"
                  />
                ) : (
                  <div className="journal-featured-placeholder" />
                )}
              </div>
              <div className="journal-featured-accent" />
            </div>
            <div className="journal-featured-body">
              <span className="journal-featured-category">{featured.category}</span>
              <h3 className="journal-featured-title">{featured.title}</h3>
              <p className="journal-featured-excerpt">{featured.excerpt}</p>
              <div className="journal-featured-footer">
                <span className="journal-featured-meta">
                  {new Date(featured.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' '}&middot;{' '}
                  {featured.readingTime} min read
                </span>
                <span className="journal-featured-cta">
                  Read article <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>

          {/* Secondary — stacked right column */}
          <div className="journal-side">
            {secondary.map((post, i) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="journal-side-card"
                aria-label={`Read: ${post.title}`}
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                <div className="journal-side-image-wrap">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 38vw"
                      className="journal-side-image"
                    />
                  ) : (
                    <div className="journal-side-placeholder" />
                  )}
                </div>
                <div className="journal-side-body">
                  <span className="journal-side-category">{post.category}</span>
                  <h3 className="journal-side-title">{post.title}</h3>
                  <p className="journal-side-excerpt">{post.excerpt}</p>
                  <span className="journal-side-meta">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' '}&middot;{' '}
                    {post.readingTime} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="journal-cta reveal">
          <div className="journal-cta-line" />
          <Link href="/blog" className="journal-cta-link">
            <span>View all articles</span>
            <ArrowRight size={16} />
          </Link>
          <div className="journal-cta-line" />
        </div>
      </div>
    </section>
  );
}
