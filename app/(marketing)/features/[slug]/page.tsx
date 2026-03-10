import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FEATURES, getFeatureBySlug } from '@/config/features';
import { FeaturePageClient } from '@/views/components/features/FeaturePageClient';

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};
  return {
    title: `${feature.label} — Pitchr`,
    description: feature.tagline,
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  return <FeaturePageClient feature={feature} allFeatures={FEATURES} />;
}
