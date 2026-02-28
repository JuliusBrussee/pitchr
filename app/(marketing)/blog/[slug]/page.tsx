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
import { getBlogAuthor } from '@/lib/blogAuthors';
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
  const baseUrl = 'https://pitchr.app';
  const coverImageUrl = meta.coverImage
    ? (meta.coverImage.startsWith('http') ? meta.coverImage : `${baseUrl}${meta.coverImage}`)
    : null;
  return {
    title: `${meta.title} — Pitchr Blog`,
    description: meta.excerpt,
    openGraph: {
      title: meta.title,
      description: meta.excerpt,
      type: 'article',
      publishedTime: meta.date,
      modifiedTime: meta.lastModified || meta.date,
      authors: [meta.author],
      tags: meta.tags,
      ...(coverImageUrl ? { images: [{ url: coverImageUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.excerpt,
      ...(coverImageUrl ? { images: [coverImageUrl] } : {}),
    },
    authors: [{ name: meta.author }],
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content } = post;
  const authorProfile = getBlogAuthor(meta.author);
  const related = getRelatedPosts(slug, meta.category);

  // Extract FAQ pairs from content (supports <FAQItem /> components and legacy markdown)
  const faqPairs: { question: string; answer: string }[] = [];
  const normalizeFaqText = (value: string): string =>
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

  const faqComponentRegex = /<FAQItem\b([\s\S]*?)>([\s\S]*?)<\/FAQItem>/g;
  let componentMatch;
  while ((componentMatch = faqComponentRegex.exec(content)) !== null) {
    const attrs = componentMatch[1];
    const answerRaw = componentMatch[2];
    const questionMatch = attrs.match(/question=(?:"([^"]+)"|'([^']+)')/);
    const question = questionMatch?.[1] || questionMatch?.[2] || '';
    const answer = normalizeFaqText(answerRaw);
    if (question && answer) {
      faqPairs.push({ question: question.trim(), answer });
    }
  }

  if (faqPairs.length === 0) {
    const faqMatch = content.match(/## FAQ[\s\S]*$/);
    if (faqMatch) {
      const faqRegex = /\*\*Q:\s*(.+?)\*\*\s*\nA:\s*(.+?)(?=\n\n|\n\*\*Q:|\s*$)/g;
      let legacyMatch;
      while ((legacyMatch = faqRegex.exec(faqMatch[0])) !== null) {
        faqPairs.push({
          question: legacyMatch[1].trim(),
          answer: normalizeFaqText(legacyMatch[2]),
        });
      }
    }
  }

  const baseUrl = 'https://pitchr.app';
  const coverImageUrl = meta.coverImage
    ? (meta.coverImage.startsWith('http') ? meta.coverImage : `${baseUrl}${meta.coverImage}`)
    : null;

  // JSON-LD structured data — content is from our own frontmatter, not user input
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.title,
      description: meta.excerpt,
      datePublished: meta.date,
      dateModified: meta.lastModified || meta.date,
      author: authorProfile
        ? {
            '@type': 'Person',
            name: authorProfile.name,
            description: authorProfile.bio,
            ...(authorProfile.sameAs ? { sameAs: authorProfile.sameAs } : {}),
          }
        : { '@type': 'Person', name: meta.author },
      publisher: {
        '@type': 'Organization',
        name: 'Pitchr',
        url: baseUrl,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${slug}`,
      },
      ...(coverImageUrl ? { image: coverImageUrl } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: meta.title, item: `${baseUrl}/blog/${slug}` },
      ],
    },
  ];

  if (faqPairs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqPairs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  const jsonLdString = JSON.stringify(schemas);

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
        {authorProfile && (
          <p className="blog-post-author-bio">
            <strong>{authorProfile.role}.</strong> {authorProfile.bio}
          </p>
        )}
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
