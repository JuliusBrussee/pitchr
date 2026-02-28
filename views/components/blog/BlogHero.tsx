import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';

export function BlogHero({ post }: { post: BlogPostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-hero">
      <div className="blog-hero-text">
        <span className="blog-hero-label">Featured</span>
        <span className="blog-hero-category">{post.category}</span>
        <h2 className="blog-hero-title">{post.title}</h2>
        <p className="blog-hero-excerpt">{post.excerpt}</p>
        <div className="blog-hero-meta">
          <span>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="blog-hero-meta-dot" />
          <span>{post.readingTime} min read</span>
        </div>
        <span className="blog-hero-cta">
          Read article <ArrowRight size={16} />
        </span>
      </div>
      <div className="blog-hero-visual">
        <div className="blog-hero-image-wrap">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
              className="blog-hero-image"
            />
          ) : (
            <div className="blog-hero-image-placeholder" />
          )}
        </div>
        <div className="blog-hero-accent-bar" />
      </div>
    </Link>
  );
}
