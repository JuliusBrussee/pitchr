import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/views/components/ThemeProvider';
import { AuthProvider } from '@/views/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Pitchr',
  description: 'AI-powered pitch battle platform',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f0f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline theme script prevents flash of wrong theme on page load.
            This is a static string with no user input — safe to inline. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('pitchr-theme');var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
