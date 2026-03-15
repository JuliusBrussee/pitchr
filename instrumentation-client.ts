import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

type RouterTransitionStart = (...args: unknown[]) => unknown;

export const onRouterTransitionStart: RouterTransitionStart = (...args) => {
  const captureRouterTransitionStart = Sentry.captureRouterTransitionStart as
    | ((...params: unknown[]) => unknown)
    | undefined;

  if (typeof captureRouterTransitionStart === 'function') {
    return captureRouterTransitionStart(...args);
  }

  return undefined;
};
