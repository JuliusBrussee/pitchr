import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("opens key app routes", async ({ page }) => {
    const routes = ["/dashboard", "/session", "/analytics"];

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);

      const expectedPath = route.slice(1);
      await expect(page).toHaveURL(new RegExp(`\\/(login|${expectedPath})(?:\\/|\\?|$)`));
    }
  });

  test("loads public and auth entry routes", async ({ page }) => {
    const homeResponse = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeResponse).not.toBeNull();
    expect(homeResponse!.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/$/);

    const loginResponse = await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(loginResponse).not.toBeNull();
    expect(loginResponse!.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login(?:\/|\\?|$)/);
  });
});
