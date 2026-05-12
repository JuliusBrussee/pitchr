import { expect, test } from '@playwright/test';

const DEEP_DIVE_CASES = [
  {
    landingLinkName: 'See the delivery rubric',
    href: '/delivery-rubric',
    breadcrumbLabel: 'Delivery Rubric',
    heading: 'What does Pitchr look for in pitch delivery?',
  },
  {
    landingLinkName: 'Read how the score is built',
    href: '/scoring-logic',
    breadcrumbLabel: 'Scoring Logic',
    heading: 'How does Pitchr turn a pitch into a score?',
  },
  {
    landingLinkName: 'Compare the free and growth path',
    href: '/growth-pricing',
    breadcrumbLabel: 'Growth Pricing',
    heading: 'What can founders do with Pitchr before they pay?',
  },
] as const;

test.describe('public marketing flow', () => {
  test.setTimeout(60_000);

  test('navigates the landing handoffs to each deep-dive route with breadcrumbs', async ({
    page,
  }) => {
    for (const route of DEEP_DIVE_CASES) {
      await page.goto('/');
      await page.locator(`a[href="${route.href}"]`).first().click();

      await expect(page).toHaveURL(new RegExp(`${route.href}$`));
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();

      const breadcrumbNav = page.getByRole('navigation', { name: 'Breadcrumbs' });
      await expect(breadcrumbNav).toBeVisible();
      await expect(breadcrumbNav.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(breadcrumbNav.getByText(route.breadcrumbLabel)).toBeVisible();

      await expect(page.getByRole('heading', { level: 2, name: 'Keep exploring' })).toBeVisible();
      await expect(page.getByRole('link', { name: /^Journal/ }).last()).toBeVisible();
    }
  });

  test('hands journal visitors off from a deep-dive route', async ({ page }) => {
    await page.goto('/delivery-rubric');

    await page.getByRole('link', { name: /^Journal/ }).last().click();

    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole('heading', { level: 1, name: /the pitch journal/i })).toBeVisible();
  });
});
