import { createElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { PUBLIC_PAGES } from '@/content/publicPages';
import { HomeJsonLd } from '@/views/components/seo/HomeJsonLd';
import * as deliveryRubricPageModule from '@/app/(marketing)/delivery-rubric/page';
import * as scoringLogicPageModule from '@/app/(marketing)/scoring-logic/page';
import * as growthPricingPageModule from '@/app/(marketing)/growth-pricing/page';
import playwrightConfig from '../playwright.config';

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

const PAGE_CASES = [
  {
    page: PUBLIC_PAGES.deliveryRubric,
    module: deliveryRubricPageModule,
  },
  {
    page: PUBLIC_PAGES.scoringLogic,
    module: scoringLogicPageModule,
  },
  {
    page: PUBLIC_PAGES.growthPricing,
    module: growthPricingPageModule,
  },
] as const;

function parseJsonLdScript(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');

  expect(script?.textContent).toBeTruthy();

  return JSON.parse(script?.textContent ?? '');
}

describe('public SEO foundations', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://preview.pitchr.test';
  });

  afterEach(() => {
    if (ORIGINAL_APP_URL) {
      process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
      return;
    }

    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('generates unique metadata and canonical URLs for each deep-dive page', async () => {
    const metadataResults = await Promise.all(
      PAGE_CASES.map(async ({ module, page }) => {
        expect(typeof module.generateMetadata).toBe('function');

        const metadata = await module.generateMetadata();

        expect(metadata?.title).toBeTruthy();
        expect(metadata?.description).toBe(page.description);
        expect(metadata?.alternates?.canonical).toBe(`https://preview.pitchr.test${page.href}`);
        expect(metadata?.openGraph?.url).toBe(`https://preview.pitchr.test${page.href}`);
        expect(metadata?.openGraph?.description).toBe(page.description);
        expect(metadata?.twitter?.description).toBe(page.description);

        return metadata;
      }),
    );

    expect(new Set(metadataResults.map((metadata) => String(metadata?.title))).size).toBe(
      metadataResults.length,
    );
  });

  it('keeps breadcrumb schema aligned with visible breadcrumbs and canonical paths', () => {
    PAGE_CASES.forEach(({ module, page }) => {
      const view = render(createElement(module.default));

      const breadcrumbNav = within(view.container).getByRole('navigation', {
        name: /breadcrumbs/i,
      });
      const schema = parseJsonLdScript(view.container);

      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(page.breadcrumbs.length);
      expect(schema.itemListElement.map((item: { name: string }) => item.name)).toEqual(
        page.breadcrumbs.map((item) => item.label),
      );
      expect(schema.itemListElement.map((item: { item: string }) => item.item)).toEqual(
        page.breadcrumbs.map((item) => `https://preview.pitchr.test${item.href === '/' ? '' : item.href}`),
      );

      expect(within(breadcrumbNav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(
        within(breadcrumbNav).getByText(page.breadcrumbs[page.breadcrumbs.length - 1].label),
      ).toHaveAttribute('aria-current', 'page');

      view.unmount();
    });
  });

  it('shares the public base URL helper between home json-ld and public route metadata', async () => {
    const homeView = render(createElement(HomeJsonLd));
    const homeSchemas = parseJsonLdScript(homeView.container);

    expect(Array.isArray(homeSchemas)).toBe(true);
    expect(homeSchemas[0].url).toBe('https://preview.pitchr.test');
    expect(homeSchemas[0].logo).toBe('https://preview.pitchr.test/icon.svg');
    expect(homeSchemas[1].url).toBe('https://preview.pitchr.test');
    expect(homeSchemas[2].url).toBe('https://preview.pitchr.test');

    expect(typeof deliveryRubricPageModule.generateMetadata).toBe('function');
    const deliveryRubricMetadata = await deliveryRubricPageModule.generateMetadata();

    expect(deliveryRubricMetadata?.openGraph?.url).toBe(
      'https://preview.pitchr.test/delivery-rubric',
    );

    homeView.unmount();
  });

  it('includes the deep-dive routes in the sitemap and uses yarn for the public smoke server', () => {
    const urls = sitemap().map((entry) => entry.url);
    const webServer = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer[0]
      : playwrightConfig.webServer;

    expect(urls).toEqual(
      expect.arrayContaining([
        'https://preview.pitchr.test/delivery-rubric',
        'https://preview.pitchr.test/scoring-logic',
        'https://preview.pitchr.test/growth-pricing',
      ]),
    );
    expect(webServer?.command).toBe('yarn dev');
  });
});
