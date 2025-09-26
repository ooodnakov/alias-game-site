import { test, expect } from "@playwright/test";
import path from "node:path";

const deckFixture = path.join(
  process.cwd(),
  "tests",
  "e2e",
  "fixtures",
  "new-deck.json",
);

test.describe("deck upload flow", () => {
  test("uploads a deck and navigates via the import link", async ({ page }) => {
    await page.goto("/decks/upload");

    const uploadResponsePromise = page.waitForResponse((response) => {
      return response.url().includes("/api/decks") && response.request().method() === "POST";
    });

    await page.setInputFiles("#deck-file", deckFixture);
    await page.click("button:has-text('Submit deck')");

    await expect(
      page.getByText("Deck published instantly! It's live in the gallery."),
    ).toBeVisible();

    const uploadResponse = await uploadResponsePromise;
    const payload = await uploadResponse.json();
    const deckSlug = payload?.slug;

    if (typeof deckSlug !== "string") {
      throw new Error("Deck slug missing from upload response");
    }

    const decksResponse = await page.request.get(
      `/api/decks?q=${encodeURIComponent("Playwright Upload Deck")}`,
    );
    expect(decksResponse.ok()).toBe(true);

    const decksPayload = await decksResponse.json();
    const matchedDeck = decksPayload?.items?.find((item: { slug?: string }) => item?.slug === deckSlug);

    expect(matchedDeck).toBeTruthy();
    expect(matchedDeck.importUrl).toMatch(/alias:\/\/import/);
    expect(matchedDeck.importUrl).toBe(payload.importUrl);
  });
});
