import { test, expect } from "@playwright/test";

test("welcome screen renders start button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("start-button")).toBeVisible();
});
