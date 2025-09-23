import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as decksGet, POST as decksPost } from "@/app/api/decks/route";
import { __resetDeckStoreForTests } from "@/lib/deck-store";
import type { Deck } from "@/lib/deck-schema";
import { NextRequest } from "next/server";

const createDeckPayload = (overrides: Partial<Deck> = {}): Deck => ({
  title: "Integration Deck",
  author: "Test Runner",
  language: "en",
  allowNSFW: false,
  metadata: {
    categories: ["Test"],
    wordClasses: ["noun"],
  },
  words: Array.from({ length: 20 }, (_, index) => ({
    text: `Card ${index + 1}`,
    difficulty: index % 5,
  })),
  ...overrides,
});

describe("/api/decks", () => {
  beforeEach(() => {
    __resetDeckStoreForTests();
  });

  afterEach(() => {
    __resetDeckStoreForTests();
  });

  it("returns deck listings with metadata", async () => {
    const request = new NextRequest("http://localhost/api/decks");
    const response = await decksGet(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items[0]).toMatchObject({
      deckUrl: expect.stringContaining("/decks/"),
      jsonUrl: expect.stringContaining("/decks/"),
      importUrl: expect.stringContaining("alias://"),
    });
  });

  it("creates a deck from JSON payloads", async () => {
    const deck = createDeckPayload();
    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: JSON.stringify(deck),
      headers: { "content-type": "application/json" },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.slug).toBeDefined();
    expect(payload.importUrl).toContain("alias://");

    const searchRequest = new NextRequest(
      `http://localhost/api/decks?q=${encodeURIComponent("Integration Deck")}`,
    );
    const searchResponse = await decksGet(searchRequest);
    const searchPayload = await searchResponse.json();

    expect(searchPayload.items.some((item: { slug: string }) => item.slug === payload.slug)).toBe(true);
  });

  it("rejects invalid payloads", async () => {
    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: JSON.stringify({ title: "Incomplete" }),
      headers: { "content-type": "application/json" },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.message).toBe("Deck JSON failed validation");
  });
});
