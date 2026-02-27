import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("opens key app routes", async ({ page }) => {
    await page.goto("/dashboard");
    const startSessionLink = page.getByRole("link", { name: /Start Session/i });
    await expect(startSessionLink).toBeVisible();
    await page.goto("/session");
    await expect(page).toHaveURL(/\/session(?:\/select-project.*)?$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/analytics");
    await expect(page).toHaveURL(/\/analytics$/);
  });

  test("session controls respond", async ({ page }) => {
    await page.goto("/session");

    const useProjectButton = page.getByRole("button", { name: /Use this project/i });
    if (await useProjectButton.isVisible()) {
      await useProjectButton.click();
      await expect(page).toHaveURL(/\/session$/);
    }

    const start = page.getByLabel("Start session");
    await expect(start).toBeVisible();
    await start.click();

    await expect(page.getByRole("button", { name: /^Pause session$/ })).toBeVisible();

    await page.getByRole("button", { name: /^Pause session$/ }).click();
  });
});
