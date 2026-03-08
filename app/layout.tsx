import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/views/components/ThemeProvider';
import { AnalyticsScripts } from '@/views/components/AnalyticsScripts';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pitchr.live';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Pitchr | AI Pitch Coach for Founders',
    template: '%s | Pitchr',
  },
  description:
    'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics — all in under 30 seconds.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pitchr | AI Pitch Coach for Founders',
    description:
      'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.',
    url: APP_URL,
    siteName: 'Pitchr',
    type: 'website',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'Pitchr — AI Pitch Coach' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pitchr | AI Pitch Coach for Founders',
    description:
      'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
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
        <link rel="help" type="text/plain" href="/llms.txt" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {GA_MEASUREMENT_ID ? <AnalyticsScripts measurementId={GA_MEASUREMENT_ID} /> : null}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
