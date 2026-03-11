import { expect, test } from "@playwright/test";

test.describe("auth redirect protection", () => {
  test("redirects unauthenticated users from protected app routes to login", async ({ page }) => {
    const protectedRoutes = ["/upload", "/arena", "/progress", "/setup", "/orb-preview"];
    const bypassAuth = process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH === "true";

    for (const route of protectedRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);

      if (bypassAuth) {
        await expect(page).toHaveURL(new RegExp(`${route}(?:\\/|\\?|$)`));
        continue;
      }

      await expect(page).toHaveURL(/\/login(?:\/|\?|$)/);
      const current = new URL(page.url());
      expect(current.searchParams.get("redirectTo")).toBe(route);
    }
  });
});
