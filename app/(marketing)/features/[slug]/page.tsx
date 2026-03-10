import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FEATURES, getFeatureBySlug } from '@/config/features';
import { CHAPTERS, getChapterBySlug, getRedirectChapter } from '@/config/chapters';
import { FeaturePageClient } from '@/views/components/features/FeaturePageClient';
import { AnalyzeChapter } from '@/views/components/features/chapters/AnalyzeChapter';
import { ImproveChapter } from '@/views/components/features/chapters/ImproveChapter';
import { PrepareChapter } from '@/views/components/features/chapters/PrepareChapter';
import { TrackChapter } from '@/views/components/features/chapters/TrackChapter';
import { CompeteChapter } from '@/views/components/features/chapters/CompeteChapter';
import '@/app/(marketing)/features/chapters.css';

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

const CHAPTER_SLUGS = CHAPTERS.map((c) => c.slug);
const ALL_SLUGS = [...CHAPTER_SLUGS, ...FEATURES.map((f) => f.slug)];

export async function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;

  /* Chapter page */
  const chapter = getChapterBySlug(slug);
  if (chapter) {
    return {
      title: `${chapter.title}: ${chapter.verb} — Pitchr`,
      description: chapter.tagline,
    };
  }

  /* Legacy feature page (will redirect, but metadata still needed for SEO) */
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};
  return {
    title: `${feature.label} — Pitchr`,
    description: feature.tagline,
  };
}

const CHAPTER_COMPONENTS: Record<string, React.ComponentType<{ chapter: import('@/config/chapters').ChapterConfig }>> = {
  analyze: AnalyzeChapter,
  improve: ImproveChapter,
  prepare: PrepareChapter,
  track: TrackChapter,
  compete: CompeteChapter,
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;

  /* 1. Chapter page — render unique layout */
  const chapter = getChapterBySlug(slug);
  if (chapter) {
    const Component = CHAPTER_COMPONENTS[chapter.slug];
    return <Component chapter={chapter} />;
  }

  /* 2. Old feature slug — redirect to parent chapter */
  const redirectSlug = getRedirectChapter(slug);
  if (redirectSlug) {
    redirect(`/features/${redirectSlug}`);
  }

  /* 3. Unknown slug — legacy feature page or 404 */
  const feature = getFeatureBySlug(slug);
  if (feature) {
    return <FeaturePageClient feature={feature} allFeatures={FEATURES} />;
  }

  notFound();
}
