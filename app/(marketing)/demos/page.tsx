import type { Metadata } from 'next';
import { LandingDemosClient } from '@/views/components/landing-demos/LandingDemosClient';

export const metadata: Metadata = {
  title: 'Pitchr — Generate, Practice, Review, Improve',
  description:
    'AI pitch coaching for founders. Generate pitch decks, practice live investor Q&A, review session performance, and improve through structured repetition.',
};

export default function DemosPage() {
  return <LandingDemosClient />;
}
