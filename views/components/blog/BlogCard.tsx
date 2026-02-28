import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostMeta } from '@/types/blog';

export function BlogCard({ post, index }: { post: BlogPostMeta; index?: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      {index !== undefined && (
        <span className="blog-card-number">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <div className="blog-card-image-wrap">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
            className="blog-card-image"
          />
        ) : (
          <div className="blog-card-image-placeholder" />
        )}
      </div>
      <div className="blog-card-body">
        <span className="blog-card-category">{post.category}</span>
        <h3 className="blog-card-title">{post.title}</h3>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <div className="blog-card-meta">
          <span className="blog-card-meta-item">
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="blog-card-meta-dot" />
          <span className="blog-card-meta-item">
            {post.readingTime} min read
          </span>
        </div>
      </div>
    </Link>
  );
}
