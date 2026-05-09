import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  ["/", "landing"],
  ["/login", "login"],
  ["/signup", "signup"],
  ["/forgot-password", "forgot password"],
  ["/reset-password?token=test-token", "reset password"],
];

for (const [path, label] of pages) {
  test(`${label} page has no critical accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();

    expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
  });
}
