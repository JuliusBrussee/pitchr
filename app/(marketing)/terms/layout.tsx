import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'Terms of service for Pitchr, the AI pitch coach for startup founders.',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
