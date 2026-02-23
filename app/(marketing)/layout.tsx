import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitchr — AI Pitch Coach for Founders',
  description: 'Record your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics. Ship investor-ready pitches faster.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
