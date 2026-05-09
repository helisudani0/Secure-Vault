import { expect, test } from "@playwright/test";

test("password recovery request uses the real API contract", async ({ page }) => {
  await page.route("**/api/auth/password/reset/request/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Password reset email sent",
        reset_url: "http://127.0.0.1:4173/reset-password?token=test-reset-token",
      }),
    });
  });

  await page.goto("/login");
  await page.getByRole("link", { name: /forgot account password/i }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel(/verified email/i).fill("verified@example.com");
  await page.getByRole("button", { name: /send reset email/i }).click();

  await expect(page.getByText(/password reset email sent/i)).toBeVisible();
  await page.getByRole("button", { name: /open local reset link/i }).click();
  await expect(page).toHaveURL(/\/reset-password\?token=test-reset-token/);
});

test("reset page validates mismatched passwords before calling the backend", async ({ page }) => {
  let resetCalled = false;
  await page.route("**/api/auth/password/reset/", async (route) => {
    resetCalled = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Password reset successfully" }),
    });
  });

  await page.goto("/reset-password?token=test-reset-token");
  await page.locator('input[type="password"]').nth(0).fill("StrongPass123!");
  await page.locator('input[type="password"]').nth(1).fill("DifferentPass123!");
  await page.getByRole("button", { name: /reset password/i }).click();

  await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  expect(resetCalled).toBe(false);
});

test("auth surfaces fit mobile without horizontal scrolling", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only responsiveness smoke");

  for (const path of ["/login", "/signup", "/forgot-password", "/reset-password?token=test"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
