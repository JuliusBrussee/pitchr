import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { mdxComponents } from '@/views/components/blog/MDXComponents';
import { TableOfContents } from '@/views/components/blog/TableOfContents';
import { ReadingProgress } from '@/views/components/blog/ReadingProgress';
import { BlogCard } from '@/views/components/blog/BlogCard';
import '../blog.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const { meta } = post;
  return {
    title: `${meta.title} — Pitchr Blog`,
    description: meta.excerpt,
    openGraph: {
      title: meta.title,
      description: meta.excerpt,
      type: 'article',
      publishedTime: meta.date,
      authors: [meta.author],
      tags: meta.tags,
      ...(meta.coverImage ? { images: [{ url: meta.coverImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content } = post;
  const related = getRelatedPosts(slug, meta.category);

  // JSON-LD structured data — content is from our own frontmatter, not user input
  const jsonLdString = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    author: { '@type': 'Person', name: meta.author },
    ...(meta.coverImage ? { image: meta.coverImage } : {}),
  });

  return (
    <div className="blog-post">
      <ReadingProgress />

      <script type="application/ld+json" suppressHydrationWarning>
        {jsonLdString}
      </script>

      <header className="blog-post-header">
        <Link href="/blog" className="blog-back-link">
          <ArrowLeft size={14} />
          Back to journal
        </Link>
        <span className="blog-post-category">{meta.category}</span>
        <h1 className="blog-post-title">{meta.title}</h1>
        <div className="blog-post-meta">
          <span className="blog-post-meta-item">
            <Calendar size={14} />
            {new Date(meta.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="blog-post-meta-item">
            <Clock size={14} />
            {meta.readingTime} min read
          </span>
          <span className="blog-post-author">by {meta.author}</span>
        </div>
      </header>

      {meta.coverImage && (
        <div className="blog-post-cover">
          <Image
            src={meta.coverImage}
            alt={meta.title}
            fill
            sizes="100vw"
            priority
            className="blog-post-cover-img"
          />
        </div>
      )}

      <div className="blog-post-layout">
        <aside className="blog-post-sidebar">
          <TableOfContents />
        </aside>
        <article className="blog-content">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                rehypePlugins: [
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                  [rehypePrettyCode, { theme: 'github-dark-dimmed' }],
                ],
              },
            }}
          />
        </article>
      </div>

      {related.length > 0 && (
        <section className="blog-related">
          <h3 className="blog-related-title">Continue reading</h3>
          <div className="blog-related-grid">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
