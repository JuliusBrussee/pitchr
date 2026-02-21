import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/views/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Pitchr',
  description: 'AI-powered pitch battle platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
