import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Record Demo',
  robots: 'noindex',
};

export default function RecordDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
