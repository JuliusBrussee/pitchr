import { forwardRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock('@/views/components/ThemeProvider', () => ({
  useTheme: () => ({
    isDark: false,
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/views/components/landing/HeroPresenterTiles', () => ({
  HeroPresenterTiles: forwardRef<HTMLDivElement, { maxRenderTiles?: number }>(function MockHeroPresenterTiles(
    { maxRenderTiles },
    ref,
  ) {
    return <div ref={ref} data-testid="hero-presenter-tiles">{maxRenderTiles}</div>;
  }),
}));

vi.mock('@/views/components/landing/useHeroDeliveryFunnel', () => ({
  useHeroDeliveryFunnel: () => undefined,
}));

vi.mock('@/views/components/PitchrLogo', () => ({
  PitchrLogo: () => <span data-testid="pitchr-logo">Pitchr</span>,
}));

import { PUBLIC_PAGES } from '@/content/publicPages';
import DeliveryRubricPage from '@/app/(marketing)/delivery-rubric/page';
import GrowthPricingPage from '@/app/(marketing)/growth-pricing/page';
import ScoringLogicPage from '@/app/(marketing)/scoring-logic/page';
import { LandingClient } from '@/views/components/landing/LandingClient';
import { PublicPageShell } from '@/views/components/public/PublicPageShell';

const SAMPLE_POSTS = [
  {
    slug: 'story-architecture',
    title: 'Story Architecture for Fundraising',
    excerpt: 'Shape a pitch narrative investors can actually retell.',
    date: '2026-03-01',
    readingTime: 6,
    category: 'Pitch Tips',
    coverImage: undefined,
  },
  {
    slug: 'proof-before-claims',
    title: 'Proof Before Claims',
    excerpt: 'Lead with evidence before big promises.',
    date: '2026-02-20',
    readingTime: 5,
    category: 'Founder Insights',
    coverImage: undefined,
  },
  {
    slug: 'pricing-signals',
    title: 'Pricing Signals That Read as Growth',
    excerpt: 'Explain the upgrade path without sounding vague.',
    date: '2026-02-10',
    readingTime: 4,
    category: 'Startup Strategy',
    coverImage: undefined,
  },
];

describe('public marketing routes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T12:00:00Z'));

    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });

    vi.stubGlobal(
      'requestAnimationFrame',
      ((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)) as typeof requestAnimationFrame,
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      ((id: number) => window.clearTimeout(id)) as typeof cancelAnimationFrame,
    );

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('defines typed content for the lean three public routes', () => {
    expect(Object.keys(PUBLIC_PAGES)).toEqual([
      'deliveryRubric',
      'scoringLogic',
      'growthPricing',
    ]);

    Object.values(PUBLIC_PAGES).forEach((page) => {
      expect(page.slug.length).toBeGreaterThan(0);
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(0);
      expect(page.hero.eyebrow.length).toBeGreaterThan(0);
      expect(page.hero.question.length).toBeGreaterThan(0);
      expect(page.hero.answer.length).toBeGreaterThan(0);
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(page.faqs.length).toBeGreaterThan(0);
      expect(page.breadcrumbs.length).toBeGreaterThanOrEqual(2);
      expect(page.relatedLinks.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('renders the shared public-page shell', () => {
    const page = PUBLIC_PAGES.deliveryRubric;

    render(<PublicPageShell page={page} />);

    expect(screen.getByRole('navigation', { name: /breadcrumbs/i })).toBeInTheDocument();
    expect(screen.getByText(page.hero.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: page.hero.question }),
    ).toBeInTheDocument();
    expect(screen.getByText(page.hero.answer)).toBeInTheDocument();

    page.sections.forEach((section) => {
      expect(
        screen.getByRole('heading', { level: 2, name: section.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(section.body)).toBeInTheDocument();
    });

    const faqRegion = screen.getByRole('region', { name: /common questions/i });
    page.faqs.forEach((faq) => {
      expect(within(faqRegion).getByText(faq.question)).toBeInTheDocument();
      expect(within(faqRegion).getByText(faq.answer)).toBeInTheDocument();
    });

    const relatedRegion = screen.getByRole('navigation', { name: /keep exploring/i });
    page.relatedLinks.forEach((link) => {
      expect(within(relatedRegion).getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      );
      expect(within(relatedRegion).getByText(link.description)).toBeInTheDocument();
    });
  });

  it('keeps related links focused on the public cluster without using banned handoff copy', () => {
    Object.values(PUBLIC_PAGES).forEach((page) => {
      const hrefs = page.relatedLinks.map((link) => link.href);

      expect(hrefs).toEqual(
        expect.arrayContaining([
          '/delivery-rubric',
          '/scoring-logic',
          '/growth-pricing',
          '/blog',
        ]),
      );

      page.relatedLinks.forEach((link) => {
        expect(link.label.toLowerCase()).not.toContain('go deeper');
        expect(link.description.toLowerCase()).not.toContain('go deeper');
      });
    });
  });

  it('links the landing hub to the dedicated deep-dive routes', () => {
    const { container } = render(<LandingClient posts={SAMPLE_POSTS} />);

    expect(container.querySelectorAll('a[href="/delivery-rubric"]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('a[href="/scoring-logic"]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll('a[href="/growth-pricing"]').length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('From the Journal')).toBeInTheDocument();
    expect(screen.getByText('Simple Pricing')).toBeInTheDocument();
    expect(screen.getByText('LAUNCH SEQUENCE')).toBeInTheDocument();
  });

  it('renders the dedicated deep-dive pages with route-owned primer content', () => {
    const cases = [
      { page: PUBLIC_PAGES.deliveryRubric, Component: DeliveryRubricPage },
      { page: PUBLIC_PAGES.scoringLogic, Component: ScoringLogicPage },
      { page: PUBLIC_PAGES.growthPricing, Component: GrowthPricingPage },
    ];

    cases.forEach(({ page, Component }) => {
      const view = render(<Component />);

      expect(
        screen.getByRole('heading', { level: 1, name: page.hero.question }),
      ).toBeInTheDocument();
      expect(screen.getByText(page.hero.answer)).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /breadcrumbs/i })).toBeInTheDocument();

      const relatedRegion = screen.getByRole('navigation', { name: /keep exploring/i });
      expect(within(relatedRegion).getByRole('link', { name: 'Delivery Rubric' })).toHaveAttribute(
        'href',
        '/delivery-rubric',
      );
      expect(within(relatedRegion).getByRole('link', { name: 'Scoring Logic' })).toHaveAttribute(
        'href',
        '/scoring-logic',
      );
      expect(within(relatedRegion).getByRole('link', { name: 'Growth Pricing' })).toHaveAttribute(
        'href',
        '/growth-pricing',
      );
      expect(within(relatedRegion).getByRole('link', { name: 'Journal' })).toHaveAttribute(
        'href',
        '/blog',
      );

      view.unmount();
    });
  });
});
