import type { Metadata } from 'next';
import { DemoClient } from '@/views/components/demo/DemoClient';

export const metadata: Metadata = {
  title: 'Pitchr Demo — See It in Action',
  description:
    'Watch a cinematic walkthrough of Pitchr: AI-powered pitch scoring, ranked fixes, rewrite diffs, and delivery metrics.',
};

export default function DemoPage() {
  return <DemoClient />;
}
