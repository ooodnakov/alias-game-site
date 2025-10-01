import { test, expect } from "@playwright/test";

test.describe("language switching", () => {
  test("stores a locale cookie when a new language is selected", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Language selector").click();
    await page.getByRole("option", { name: "Русский" }).click();

    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.find((cookie) => cookie.name === "NEXT_LOCALE")?.value;
      })
      .toBe("ru");
  });
});
