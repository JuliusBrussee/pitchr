import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Privacy notice for Pitchr, the AI pitch coach for startup founders.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
