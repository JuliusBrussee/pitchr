import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SOLUTIONS, getSolutionBySlug } from '@/config/solutions';
import { SolutionPageClient } from '@/views/components/solutions/SolutionPageClient';

interface SolutionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: SolutionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);
  if (!solution) return {};
  return {
    title: `${solution.label} — Pitchr`,
    description: solution.tagline,
  };
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);
  if (!solution) notFound();

  return <SolutionPageClient solution={solution} allSolutions={SOLUTIONS} />;
}
