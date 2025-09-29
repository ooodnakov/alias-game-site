import { test, expect } from "@playwright/test";

test.describe("language switching", () => {
  test("updates navigation labels when a new language is selected", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Language selector").click();
    await page.getByRole("option", { name: "Русский" }).click();

    await expect(page.getByRole("link", { name: "Колоды" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Русский" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Decks" })).not.toBeVisible();
  });
});
