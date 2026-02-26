import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/views/components/ThemeProvider';
import { AuthProvider } from '@/views/components/AuthProvider';
import { TutorialProvider } from '@/views/components/TutorialProvider';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: 'Pitchr — AI Pitch Coach',
  description: 'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics — all in under 30 seconds.',
  metadataBase: new URL('https://pitchr.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pitchr — AI Pitch Coach',
    description: 'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.',
    url: 'https://pitchr.app',
    siteName: 'Pitchr',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pitchr — AI Pitch Coach',
    description: 'Record or paste your pitch, get an investor-grade score out of 100, ranked fixes, a rewritten script, and delivery metrics.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
        <ThemeProvider>
          <AuthProvider>
            <TutorialProvider>{children}</TutorialProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
