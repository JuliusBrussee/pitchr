import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
import { BlogNavbar } from '@/views/components/blog/BlogNavbar';
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
  const baseUrl = 'https://pitchr.live';
  const coverImageUrl = meta.coverImage
    ? (meta.coverImage.startsWith('http') ? meta.coverImage : `${baseUrl}${meta.coverImage}`)
    : null;
  const ogTitle = `${meta.title} | Pitchr`;
  return {
    title: meta.title,
    description: meta.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: ogTitle,
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
      title: ogTitle,
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

  const baseUrl = 'https://pitchr.live';
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

  const formattedDate = new Date(meta.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="blog-post">
      <ReadingProgress />

      <script type="application/ld+json" suppressHydrationWarning>
        {jsonLdString}
      </script>

      <BlogNavbar />

      {/* Full-bleed hero with cover image */}
      {meta.coverImage ? (
        <div className="blog-post-hero">
          <div className="blog-post-hero-image">
            <Image
              src={meta.coverImage}
              alt={meta.title}
              fill
              sizes="100vw"
              priority
              className="blog-post-cover-img"
            />
            <div className="blog-post-hero-overlay" />
          </div>
          <div className="blog-post-hero-content">
            <span className="blog-post-category">{meta.category}</span>
            <h1 className="blog-post-title">{meta.title}</h1>
            <p className="blog-post-excerpt">{meta.excerpt}</p>
          </div>
        </div>
      ) : (
        <header className="blog-post-header">
          <span className="blog-post-category">{meta.category}</span>
          <h1 className="blog-post-title">{meta.title}</h1>
          <p className="blog-post-excerpt">{meta.excerpt}</p>
        </header>
      )}

      {/* Byline bar — newspaper dateline style */}
      <div className="blog-post-byline-bar">
        <div className="blog-post-byline-inner">
          <div className="blog-post-byline-left">
            <span className="blog-post-byline-author">
              By <strong>{meta.author}</strong>
            </span>
            {authorProfile && (
              <span className="blog-post-byline-role">{authorProfile.role}</span>
            )}
          </div>
          <div className="blog-post-byline-right">
            <time className="blog-post-byline-date" dateTime={meta.date}>{formattedDate}</time>
            <span className="blog-post-byline-separator" aria-hidden="true" />
            <span className="blog-post-byline-reading">{meta.readingTime} min read</span>
          </div>
        </div>
      </div>

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

      {/* Editorial footer */}
      {related.length > 0 && (
        <section className="blog-related">
          <div className="blog-related-header">
            <div className="blog-related-rule" />
            <span className="blog-related-label">More from The Pitch Journal</span>
            <div className="blog-related-rule" />
          </div>
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
