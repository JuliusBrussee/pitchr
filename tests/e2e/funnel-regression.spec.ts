import { expect, test } from '@playwright/test';

test.describe('local regression funnel', () => {
  test.setTimeout(90_000);

  test('completes Dashboard -> Session -> Analyze -> Results -> History', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('pitchr_local_regression_edge_v1');
      window.localStorage.removeItem('pitchr_active_project');
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
    await expect(page.getByRole('button', { name: 'Start Session' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Start Session' }).first().click();
    await expect(page).toHaveURL(/\/session(?:\/|\?|$)/, { timeout: 15_000 });

    const startControl = page.locator('button[aria-label="Start session"]');
    await expect(startControl).toBeVisible({ timeout: 15_000 });
    await startControl.click();

    const stopControl = page.locator('button[aria-label="Stop session"]');
    await expect(stopControl).toBeVisible({ timeout: 15_000 });
    await stopControl.click();

    await expect(page).toHaveURL(/\/results\/[^/?#]+(?:\?|$)/);
    await expect(page.getByRole('heading', { name: 'Pitch Analysis' })).toBeVisible();

    const historyLink = page.locator('main a[href="/history"]').first();
    await expect(historyLink).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/history(?:\/|$)/, { timeout: 20_000 }),
      historyLink.click(),
    ]);
    await expect(page.getByRole('heading', { name: 'History' })).toBeVisible({ timeout: 15_000 });
  });
});
