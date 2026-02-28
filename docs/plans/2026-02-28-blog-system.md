# Blog System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an SEO-optimized, MDX-powered blog with magazine-grid listing, individual post pages, and a landing page preview section.

**Architecture:** MDX files in `content/blog/` with YAML frontmatter. `next-mdx-remote` compiles at build time. `lib/blog.ts` provides file-system utilities. Routes under `app/(marketing)/blog/`. CSS follows existing landing page patterns (CSS variables, no Tailwind for blog-specific styles).

**Tech Stack:** next-mdx-remote, gray-matter, rehype-slug, rehype-autolink-headings, rehype-pretty-code, shiki

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install blog dependencies**

Run:
```bash
yarn add next-mdx-remote gray-matter rehype-slug rehype-autolink-headings rehype-pretty-code shiki
```

**Step 2: Verify installation**

Run: `yarn build` (should still compile with no errors)
Expected: Build succeeds

**Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add MDX blog dependencies"
```

---

### Task 2: Blog Utilities (`lib/blog.ts`)

**Files:**
- Create: `lib/blog.ts`
- Create: `types/blog.ts`

**Step 1: Create blog types**

Create `types/blog.ts`:

```typescript
export interface BlogPostMeta {
  title: string;
  date: string;
  author: string;
  category: string;
  tags?: string[];
  excerpt: string;
  coverImage?: string;
  readingTime: number;
  featured?: boolean;
  slug: string;
}

export interface BlogPost {
  meta: BlogPostMeta;
  content: string;
}
```

**Step 2: Create blog utilities**

Create `lib/blog.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPostMeta, BlogPost } from '@/types/blog';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);

    return {
      title: data.title,
      date: data.date,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      readingTime: data.readingTime || calculateReadingTime(content),
      featured: data.featured || false,
      slug,
    } as BlogPostMeta;
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    meta: {
      title: data.title,
      date: data.date,
      author: data.author,
      category: data.category,
      tags: data.tags || [],
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      readingTime: data.readingTime || calculateReadingTime(content),
      featured: data.featured || false,
      slug,
    },
    content,
  };
}

export function getRelatedPosts(slug: string, category: string, limit = 3): BlogPostMeta[] {
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))];
}
```

**Step 3: Commit**

```bash
git add types/blog.ts lib/blog.ts
git commit -m "feat(blog): add blog types and file-system utilities"
```

---

### Task 3: MDX Custom Components

**Files:**
- Create: `views/components/blog/MDXComponents.tsx`

**Step 1: Create MDX component mappings**

Create `views/components/blog/MDXComponents.tsx`:

```typescript
import Image from 'next/image';
import type { MDXComponents } from 'mdx/types';

function Callout({ type = 'info', children }: { type?: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const labels: Record<string, string> = { tip: 'Tip', warning: 'Warning', info: 'Note' };
  return (
    <div className={`blog-callout blog-callout-${type}`}>
      <span className="blog-callout-label">{labels[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function BlogImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="blog-figure">
      <Image src={src} alt={alt} width={800} height={450} className="blog-image" />
      {caption && <figcaption className="blog-caption">{caption}</figcaption>}
    </figure>
  );
}

function YouTube({ id }: { id: string }) {
  return (
    <div className="blog-video">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

function Quote({ children, author }: { children: React.ReactNode; author?: string }) {
  return (
    <blockquote className="blog-quote">
      {children}
      {author && <cite className="blog-quote-author">&mdash; {author}</cite>}
    </blockquote>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  BlogImage,
  YouTube,
  Quote,
  h1: (props) => <h1 className="blog-h1" {...props} />,
  h2: (props) => <h2 className="blog-h2" {...props} />,
  h3: (props) => <h3 className="blog-h3" {...props} />,
  p: (props) => <p className="blog-p" {...props} />,
  ul: (props) => <ul className="blog-ul" {...props} />,
  ol: (props) => <ol className="blog-ol" {...props} />,
  li: (props) => <li className="blog-li" {...props} />,
  a: (props) => (
    <a
      className="blog-link"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  code: (props) => <code className="blog-inline-code" {...props} />,
  pre: (props) => <pre className="blog-pre" {...props} />,
  hr: () => <hr className="blog-hr" />,
  img: (props) => (
    <Image
      src={props.src || ''}
      alt={props.alt || ''}
      width={800}
      height={450}
      className="blog-image"
    />
  ),
};
```

**Step 2: Commit**

```bash
git add views/components/blog/MDXComponents.tsx
git commit -m "feat(blog): add MDX custom components"
```

---

### Task 4: Blog Card & Hero Components

**Files:**
- Create: `views/components/blog/BlogCard.tsx`
- Create: `views/components/blog/BlogHero.tsx`

**Step 1: Create BlogCard**

Create `views/components/blog/BlogCard.tsx`:

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';

export function BlogCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
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
            <Calendar size={14} />
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="blog-card-meta-item">
            <Clock size={14} />
            {post.readingTime} min read
          </span>
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Create BlogHero**

Create `views/components/blog/BlogHero.tsx`:

```typescript
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
```

**Step 3: Commit**

```bash
git add views/components/blog/BlogCard.tsx views/components/blog/BlogHero.tsx
git commit -m "feat(blog): add BlogCard and BlogHero components"
```

---

### Task 5: Table of Contents Component

**Files:**
- Create: `views/components/blog/TableOfContents.tsx`

**Step 1: Create TableOfContents**

Create `views/components/blog/TableOfContents.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const article = document.querySelector('.blog-content');
    if (!article) return;

    const elements = article.querySelectorAll('h2, h3');
    const items: TocItem[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: el.tagName === 'H2' ? 2 : 3,
    }));
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="blog-toc">
      <h4 className="blog-toc-title">On this page</h4>
      <ul className="blog-toc-list">
        {headings.map((h) => (
          <li
            key={h.id}
            className={`blog-toc-item ${h.level === 3 ? 'blog-toc-indent' : ''} ${activeId === h.id ? 'blog-toc-active' : ''}`}
          >
            <a href={`#${h.id}`} className="blog-toc-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/blog/TableOfContents.tsx
git commit -m "feat(blog): add sticky TableOfContents component"
```

---

### Task 6: Blog Listing Page (`/blog`)

**Files:**
- Create: `app/(marketing)/blog/page.tsx`
- Create: `app/(marketing)/blog/blog.css`

**Step 1: Create blog listing page**

Create `app/(marketing)/blog/page.tsx`:

```typescript
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
```

**Step 2: Create blog.css placeholder** (full styles in Task 10)

Create `app/(marketing)/blog/blog.css` with a comment placeholder — full CSS will be written in Task 10.

**Step 3: Commit**

```bash
git add app/(marketing)/blog/page.tsx app/(marketing)/blog/blog.css
git commit -m "feat(blog): add blog listing page with magazine grid layout"
```

---

### Task 7: Individual Post Page (`/blog/[slug]`)

**Files:**
- Create: `app/(marketing)/blog/[slug]/page.tsx`

**Step 1: Create individual post page**

Create `app/(marketing)/blog/[slug]/page.tsx`:

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { mdxComponents } from '@/views/components/blog/MDXComponents';
import { TableOfContents } from '@/views/components/blog/TableOfContents';
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.excerpt,
    datePublished: meta.date,
    author: { '@type': 'Person', name: meta.author },
    ...(meta.coverImage ? { image: meta.coverImage } : {}),
  };

  return (
    <div className="blog-post">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="blog-post-header">
        <Link href="/blog" className="blog-back-link">
          <ArrowLeft size={16} />
          Back to blog
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
          <h3 className="blog-related-title">Related articles</h3>
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
```

Note: The `dangerouslySetInnerHTML` for JSON-LD is safe because the content is serialized from our own frontmatter data (not user input). This is the standard Next.js pattern for structured data.

**Step 2: Commit**

```bash
git add app/(marketing)/blog/[slug]/page.tsx
git commit -m "feat(blog): add individual post page with SEO, TOC, and related posts"
```

---

### Task 8: Sample Blog Posts

**Files:**
- Create: `content/blog/how-to-nail-your-elevator-pitch.mdx`
- Create: `content/blog/5-mistakes-founders-make-when-pitching.mdx`
- Create: `content/blog/pitch-deck-vs-verbal-pitch.mdx`

**Step 1: Create content directory**

Run: `mkdir -p content/blog`

**Step 2: Create 3 sample blog posts**

Each post should be a well-written, realistic article (300-500 words) with proper frontmatter including title, date, author (`Pitchr Team`), category, tags, excerpt, and featured flag. The first post should have `featured: true`.

Categories to use: `Pitch Tips`, `Founder Insights`, `Strategy`.

The posts should demonstrate various MDX features:
- Post 1 (featured): Use `<Callout>`, headers, bold, lists — demonstrates practical tips formatting
- Post 2: Use numbered lists, `<Quote>` component, emphasis — demonstrates listicle format
- Post 3: Use comparison structure, headers, bullet points — demonstrates analytical format

Omit `coverImage` from frontmatter for now — the cards and hero gracefully handle missing images via CSS gradient placeholders.

**Step 3: Commit**

```bash
git add content/blog/
git commit -m "feat(blog): add 3 sample blog posts"
```

---

### Task 9: Landing Page Blog Section

**Files:**
- Create: `app/api/blog/posts/route.ts`
- Create: `views/components/landing/LandingBlog.tsx`
- Modify: `app/(marketing)/page.tsx:606-608` (add blog section before Pricing)

**Step 1: Create API route for blog posts**

The landing page (`app/(marketing)/page.tsx`) is a `'use client'` component (uses GSAP), so it cannot directly call `fs`-based blog utilities. Create a lightweight API route.

Create `app/api/blog/posts/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog';

export async function GET() {
  const posts = getAllPosts().slice(0, 3);
  return NextResponse.json(posts);
}
```

**Step 2: Create LandingBlog component**

Create `views/components/landing/LandingBlog.tsx`:

```typescript
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
```

**Step 3: Add to landing page**

In `app/(marketing)/page.tsx`, add import at the top (after other landing imports):
```typescript
import { LandingBlog } from '@/views/components/landing/LandingBlog';
```

Insert `<LandingBlog />` before `<LandingPricing />` (around line 606):
```tsx
      {/* ═══ BLOG ═══ */}
      <LandingBlog />

      {/* ═══ PRICING ═══ */}
      <LandingPricing />
```

**Step 4: Commit**

```bash
git add app/api/blog/posts/route.ts views/components/landing/LandingBlog.tsx app/(marketing)/page.tsx
git commit -m "feat(blog): add 'From the Blog' section to landing page"
```

---

### Task 10: Blog CSS (Full Implementation)

**Files:**
- Create/complete: `app/(marketing)/blog/blog.css`

**Step 1: Write the complete blog stylesheet**

This is the most design-intensive task. Use the `frontend-design` skill for guidance. The CSS must cover:

**Scopes & Variables:**
- `.blog-listing` and `.blog-post` as top-level scopes (like `.landing`)
- Reuse CSS variables from `landing.css`: `--bg`, `--bg-card`, `--border`, `--text`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-light`, `--shadow-deep`
- Same dark mode pattern: `.dark .blog-listing` and `.dark .blog-post` overrides
- Same font: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Same `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`

**Listing page:**
- `.blog-listing` — `max-width: 1200px`, centered, padding
- `.blog-listing-header` — centered text, margin bottom
- `.blog-listing-title` — large, bold
- `.blog-listing-subtitle` — `var(--text-secondary)`
- `.blog-back-link` — flex, gap, `var(--text-muted)`, hover accent
- `.blog-categories` — flex, gap, centered
- `.blog-category-pill` — small pill, `var(--bg-card)` bg, `var(--border)` border, rounded
- `.blog-grid` — 3-col grid, gap 24px
- `.blog-empty` — centered, muted text

**Cards:**
- `.blog-card` — block link, `var(--bg-card)` bg, `var(--border)` border, `border-radius: 16px`, overflow hidden, transition transform + shadow
- `.blog-card:hover` — `translateY(-4px)`, `box-shadow` with `var(--shadow-deep)`
- `.blog-card-image-wrap` — `aspect-ratio: 16/9`, relative, overflow hidden
- `.blog-card-image` — object-fit cover
- `.blog-card-image-placeholder` — gradient background (coral to orange at low opacity)
- `.blog-card-body` — padding 20px
- `.blog-card-category` — `background: var(--accent)`, white text, `border-radius: 20px`, `font-size: 11px`, uppercase, `letter-spacing: 0.05em`, inline-block, padding
- `.blog-card-title` — `font-size: 18px`, `font-weight: 600`, margin, 2-line clamp
- `.blog-card-excerpt` — `var(--text-secondary)`, `font-size: 14px`, 2-line clamp
- `.blog-card-meta` — flex, gap, `var(--text-muted)`, `font-size: 13px`, margin-top

**Hero:**
- `.blog-hero` — block link, relative, `min-height: 400px`, `border-radius: 20px`, overflow hidden, margin-bottom
- `.blog-hero-image-wrap` — absolute fill
- `.blog-hero-overlay` — absolute fill, gradient from transparent to dark
- `.blog-hero-image-placeholder` — gradient background
- `.blog-hero-content` — relative, flex column, justify end, padding 40px, z-index 1
- `.blog-hero-category` — same as card category but on dark overlay (always white)
- `.blog-hero-title` — `font-size: 32px`, white, `font-weight: 700`
- `.blog-hero-excerpt` — `rgba(255,255,255,0.8)`, max-width
- `.blog-hero-meta` — white/semi-transparent
- `.blog-hero-read-more` — accent color, flex, gap

**Post page:**
- `.blog-post` — `max-width: 1200px`, centered
- `.blog-post-header` — centered, max-width 720px, margin auto
- `.blog-post-category` — same accent badge
- `.blog-post-title` — `font-size: 40px`, `font-weight: 700`, `line-height: 1.2`
- `.blog-post-meta` — flex, gap, `var(--text-muted)`, centered
- `.blog-post-author` — `var(--text-secondary)`
- `.blog-post-cover` — `aspect-ratio: 21/9`, relative, rounded, overflow hidden, margin
- `.blog-post-cover-img` — object-fit cover
- `.blog-post-layout` — grid, `grid-template-columns: 220px 1fr`, gap 48px
- `.blog-post-sidebar` — position relative

**TOC:**
- `.blog-toc` — `position: sticky`, `top: 100px`
- `.blog-toc-title` — `font-size: 12px`, uppercase, `letter-spacing: 0.1em`, `var(--text-muted)`
- `.blog-toc-list` — list-style none, padding 0
- `.blog-toc-item` — margin 4px 0
- `.blog-toc-indent` — `padding-left: 16px`
- `.blog-toc-link` — `font-size: 13px`, `var(--text-muted)`, hover `var(--text)`, transition
- `.blog-toc-active .blog-toc-link` — `var(--accent)`, `font-weight: 500`

**MDX content:**
- `.blog-content` — `max-width: 720px`, `font-size: 17px`, `line-height: 1.8`
- `.blog-h2` — `font-size: 28px`, `font-weight: 600`, margin-top 48px, margin-bottom 16px
- `.blog-h3` — `font-size: 22px`, `font-weight: 600`, margin-top 36px, margin-bottom 12px
- `.blog-p` — margin-bottom 24px
- `.blog-ul`, `.blog-ol` — margin, padding-left
- `.blog-li` — margin-bottom 8px
- `.blog-link` — `var(--accent)`, underline offset, hover darker
- `.blog-inline-code` — `background: var(--bg-card)`, padding, rounded, `font-size: 0.9em`
- `.blog-pre` — `border-radius: 12px`, overflow auto, `font-size: 14px`, margin
- `.blog-hr` — `border: none`, `height: 1px`, `background: var(--border)`, margin 48px 0

**Callouts:**
- `.blog-callout` — `border-left: 3px solid`, padding, rounded, margin, background
- `.blog-callout-tip` — green border + green-tinted bg
- `.blog-callout-warning` — orange border + orange-tinted bg
- `.blog-callout-info` — blue border + blue-tinted bg
- `.blog-callout-label` — `font-size: 12px`, uppercase, `font-weight: 600`, margin-bottom

**Other custom components:**
- `.blog-figure` — margin, text-align center
- `.blog-caption` — `font-size: 14px`, `var(--text-muted)`, margin-top 8px
- `.blog-video` — `aspect-ratio: 16/9`, `border-radius: 12px`, overflow hidden, margin
- `.blog-video iframe` — width/height 100%, border none
- `.blog-quote` — `border-left: 3px solid var(--accent)`, padding-left, margin, `font-style: italic`, `font-size: 18px`
- `.blog-quote-author` — block, margin-top, `font-size: 14px`, `var(--text-muted)`, not italic

**Related posts:**
- `.blog-related` — margin-top 80px, padding-top, border-top
- `.blog-related-title` — `font-size: 24px`, `font-weight: 600`, margin-bottom
- `.blog-related-grid` — 3-col grid, gap

**Landing section:**
- `.blog-landing-section` — padding 80px 0
- `.blog-landing-grid` — 3-col grid, gap 24px, max-width 1100px, centered
- `.blog-landing-cta` — text-align center, margin-top 40px
- `.blog-view-all` — flex inline, gap, `var(--accent)`, `font-weight: 500`, hover underline

**Responsive (900px):**
- `.blog-grid` — 2-col
- `.blog-post-layout` — single column, hide sidebar
- `.blog-hero-title` — `font-size: 26px`
- `.blog-post-title` — `font-size: 32px`
- `.blog-landing-grid` — 2-col
- `.blog-related-grid` — 2-col

**Responsive (600px):**
- `.blog-grid` — 1-col
- `.blog-hero` — `min-height: 300px`
- `.blog-hero-title` — `font-size: 22px`
- `.blog-post-title` — `font-size: 28px`
- `.blog-content` — `font-size: 16px`
- `.blog-landing-grid` — 1-col
- `.blog-related-grid` — 1-col

**Reduced motion:**
- Disable hover transforms on cards

**Step 2: Commit**

```bash
git add app/(marketing)/blog/blog.css
git commit -m "feat(blog): add comprehensive blog stylesheet with dark mode"
```

---

### Task 11: Verify & Polish

**Step 1: Run the dev server**

Run: `yarn dev`

**Step 2: Verify blog listing page**

Navigate to `http://localhost:3000/blog`. Verify:
- Header with title and subtitle renders
- Featured post hero card shows
- Remaining posts in 3-col grid
- Cards have correct typography, spacing, hover effects
- Dark mode toggle works
- Responsive: check at 900px and 600px widths

**Step 3: Verify individual post page**

Click a post. Verify:
- SEO metadata in page source (title, description, OG tags)
- JSON-LD script tag present
- Table of contents appears on desktop, highlights on scroll
- MDX content renders with proper typography
- Custom components (Callout, Quote) render correctly
- Code blocks have syntax highlighting
- Related posts show at bottom
- Back to blog link works

**Step 4: Verify landing page section**

Navigate to `http://localhost:3000`. Verify:
- "From the Blog" section appears before Pricing
- 3 post cards display correctly
- "View all articles" link goes to `/blog`

**Step 5: Run build**

Run: `yarn build`
Expected: Build succeeds with static pages generated for `/blog` and each `/blog/[slug]`

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(blog): polish and fixes from visual review"
```
