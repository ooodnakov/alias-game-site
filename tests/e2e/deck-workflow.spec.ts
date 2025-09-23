import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deckFixture = path.resolve(__dirname, "fixtures/new-deck.json");

test.describe("deck upload flow", () => {
  test("uploads a deck and navigates via the import link", async ({ page }) => {
    await page.goto("/en/decks/upload");

    await page.setInputFiles("#deck-file", deckFixture);
    await page.click("button:has-text('Submit deck')");

    await expect(
      page.getByText("Deck published instantly! It's live in the gallery."),
    ).toBeVisible();

    await page.goto("/en/decks?q=Playwright%20Upload%20Deck");
    const card = page.locator('article').filter({ hasText: 'Playwright Upload Deck' });
    await expect(card).toBeVisible();

    await card.getByRole('link', { name: 'Import' }).click();
    await expect(page).toHaveURL(/\/en\/decks\//);

    const importLink = page.locator('a[href^="alias://import"]');
    await expect(importLink).toBeVisible();
    await expect(importLink).toHaveAttribute("href", /alias:\/\/import/);
  });
});
