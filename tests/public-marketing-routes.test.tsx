import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGES } from '@/content/publicPages';
import { PublicPageShell } from '@/views/components/public/PublicPageShell';

describe('public marketing routes', () => {
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
});
