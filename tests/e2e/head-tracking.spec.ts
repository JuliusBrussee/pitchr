import { expect, test } from "@playwright/test";

test.describe("head tracking", () => {
  test("shows engagement bubble during active session and no-face state when undetected", async ({ page }) => {
    await page.goto("/session");

    await page.getByLabel("Start session").click();

    await expect(page.getByText("Engagement")).toBeVisible();
    await expect(page.getByLabel("Engagement unavailable")).toBeVisible();
    await expect(page.getByText("No Face")).toBeVisible();
  });

  test("hides engagement bubble when camera is toggled off", async ({ page }) => {
    await page.goto("/session");

    await page.getByLabel("Start session").click();
    await expect(page.getByText("Engagement")).toBeVisible();

    const cameraToggle = page.getByRole("button", { name: /^Camera$/ });

    await cameraToggle.click();
    await expect(page.getByText("Engagement")).toHaveCount(0);

    await cameraToggle.click();
    await expect(page.getByText("Engagement")).toBeVisible();
  });
});
