'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { ANALYTICS_OPT_IN_STORAGE_KEY } from '@/hooks/useCompliance';

interface AnalyticsScriptsProps {
  measurementId: string;
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ANALYTICS_OPT_IN_STORAGE_KEY) === 'true';
}

export function AnalyticsScripts({ measurementId }: AnalyticsScriptsProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    const sync = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener('storage', sync);
    window.addEventListener('pitchr:consent-updated', sync as EventListener);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pitchr:consent-updated', sync as EventListener);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}');`}
      </Script>
    </>
  );
}