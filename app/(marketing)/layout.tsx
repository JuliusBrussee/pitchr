import type { Metadata } from 'next';
import '@/app/(marketing)/landing.css';
import '@/app/(marketing)/solutions.css';
import { MarketingNav } from '@/views/components/landing/MarketingNav';

export const metadata: Metadata = {
  description:
    'Record your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics. Ship investor-ready pitches faster.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      {children}
    </>
  );
}
