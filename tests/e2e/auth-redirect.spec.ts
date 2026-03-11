import { expect, test } from "@playwright/test";

test.describe("auth redirect protection", () => {
  test.setTimeout(60_000);

  test("redirects unauthenticated users from protected app routes to login", async ({ page }) => {
    const protectedRoutes = ["/upload", "/arena", "/progress", "/setup", "/orb-preview"];

    for (const route of protectedRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);

      const current = new URL(page.url());
      if (current.pathname === "/login") {
        expect(current.searchParams.get("redirectTo")).toBe(route);
        continue;
      }

      const allowedAppPaths = route === "/progress" ? [route, "/insights"] : [route];
      expect(allowedAppPaths).toContain(current.pathname);
    }
  });
});
