import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';

export function BlogHero({ post }: { post: BlogPostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-hero">
      <div className="blog-hero-image-wrap">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="100vw"
            priority
            className="blog-hero-image"
          />
        ) : (
          <div className="blog-hero-image-placeholder" />
        )}
        <div className="blog-hero-overlay" />
      </div>
      <div className="blog-hero-content">
        <span className="blog-hero-category">{post.category}</span>
        <h2 className="blog-hero-title">{post.title}</h2>
        <p className="blog-hero-excerpt">{post.excerpt}</p>
        <div className="blog-hero-meta">
          <span className="blog-hero-meta-item">
            <Calendar size={14} />
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="blog-hero-meta-item">
            <Clock size={14} />
            {post.readingTime} min read
          </span>
          <span className="blog-hero-read-more">
            Read article <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
