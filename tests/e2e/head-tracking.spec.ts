import { expect, test } from "@playwright/test";

async function seedSessionProject(page: import("@playwright/test").Page) {
  const activeProjectId = "proj-e2e";
  const now = new Date().toISOString();
  const projectPayload = {
    projects: [
      {
        id: activeProjectId,
        name: "E2E Project",
        description: null,
        targetMarket: null,
        keyMetrics: null,
        extraNotes: null,
        isArchived: false,
        promptOverrides: {},
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeProjectId,
  };

  await page.addInitScript(([projectId]) => {
    window.localStorage.setItem("pitchr_active_project", projectId);
  }, [activeProjectId]);

  await page.route("https://example.supabase.co/functions/v1/projects*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(projectPayload),
    });
  });

  await page.route("https://example.supabase.co/functions/v1/deck-list*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}

test.describe("head tracking", () => {
  test("shows engagement bubble during active session and no-face state when undetected", async ({ page }) => {
    await seedSessionProject(page);
    await page.goto("/session");

    await page.getByRole("button", { name: /^Start Session$/ }).click();

    const engagementValue = page.getByTestId("engagement-value");
    await expect(page.getByText("Engagement")).toBeVisible();
    await expect(engagementValue).toBeVisible();
    await expect.poll(async () => (await engagementValue.textContent())?.trim()).toBe("--");
  });

  test("hides engagement bubble when camera is toggled off", async ({ page }) => {
    await seedSessionProject(page);
    await page.goto("/session");

    await page.getByRole("button", { name: /^Start Session$/ }).click();
    const engagementValue = page.getByTestId("engagement-value");
    await expect(page.getByText("Engagement")).toBeVisible();
    await expect.poll(async () => (await engagementValue.textContent())?.trim()).toBe("--");

    await page.getByRole("button", { name: /^Camera$/ }).first().click();
    await expect.poll(async () => (await engagementValue.textContent())?.trim()).toBe("-");

    await page.getByRole("button", { name: /^Camera$/ }).first().click();
    await expect.poll(async () => (await engagementValue.textContent())?.trim()).not.toBe("-");
  });
});
